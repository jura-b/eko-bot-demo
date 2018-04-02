const express = require('express');
const ClientOAuth2 = require('client-oauth2');
const request = require('request-promise');
const router = require('express').Router();
const IntentResolver = require('../lib/IntentResolver');
const MewsService = require('../services/MewsServices');

const app = express();

const ekoAuth = new ClientOAuth2({
  clientId: process.env.EKO_OAUTH_CLIENT_ID,
  clientSecret: process.env.EKO_OAUTH_CLIENT_SECRET,
  accessTokenUri: `${process.env.EKO_HTTP_URI}/oauth/token`,
  scopes: ['bot'],
});

router.post('/webhook', async (req, res) => {
  const event = req.body && req.body.events[0];
  let token = app.get('token');

  try {
    if (!token) {
      const { data } = await ekoAuth.credentials.getToken();
      token = data;
      app.set('token', token);
    }


    // resolve incoming text
    const intentResolver = new IntentResolver();
    const message = await intentResolver.resolveAsText(event.message.text);

    const options = {
      uri: `${process.env.EKO_HTTP_URI}/bot/v1/message/text`,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      json: true,
      body: {
        replyToken: event.replyToken,
        message,
      },
      resolveWithFullResponse: true,
    };

    let response;
    try {
      response = await request.post(options);
    } catch (err) {
      if (err.statusCode === 401) {
        // maybe token expired, get new one
        const { data } = await ekoAuth.credentials.getToken();
        token = data;
        // reassign the token
        app.set('token', token);
        options.headers.Authorization = `Bearer ${token.access_token}`;

        // retry rquest
        response = await request.post(options);
      } else {
        throw err;
      }
    }

    return res.status(response.statusCode).send({
      ok: Number(response.statusCode / 100 === 200),
      message: response.body,
    });
  } catch (err) {
    console.log('/bots/webhook', err);
    return res.status(err.code || 400).send(err);
  }
});

module.exports = router;
