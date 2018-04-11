const express = require('express');
const ClientOAuth2 = require('client-oauth2');
const request = require('request-promise');
const router = require('express').Router();
const IntentResolver = require('../lib/IntentResolver');

const app = express();

const ekoAuth = new ClientOAuth2({
  clientId: process.env.EKO_OAUTH_CLIENT_ID,
  clientSecret: process.env.EKO_OAUTH_CLIENT_SECRET,
  accessTokenUri: `${process.env.EKO_HTTP_URI}/oauth/token`,
  scopes: ['bot'],
});

const authenticate = async () => {
  const { data } = await ekoAuth.credentials.getToken();
  app.set('token', data);
};

const sendMessage = async (message, replyToken) => {
  if (!app.get('token')) throw new Error('No token');

  const options = {
    uri: `${process.env.EKO_HTTP_URI}/bot/v1/message/text`,
    headers: {
      Authorization: `Bearer ${app.get('token').access_token}`,
    },
    json: true,
    body: {
      replyToken,
      message,
    },
    resolveWithFullResponse: true,
  };
  return request.post(options);
};

const trySendMessage = async (message, replyToken) => {
  try {
    return sendMessage(message, replyToken);
  } catch (err) {
    if (err.statusCode === 401) {
      // maybe token expired, get new one
      await authenticate();
      // retry rquest
      return sendMessage(message, replyToken);
    }
    throw err;
  }
};


router.post('/webhook', async (req, res) => {
  try {
    // 1. Extract the event
    const event = req.body && req.body.events[0];

    // 2. Authenticate if not authenticated
    if (!app.get('token')) {
      await authenticate();
    }


    // 3. Resolve incoming text, these will be your application logic

    // special case
    if (event.message.text.toLowerCase() === 'all') {
      await trySendMessage('Hold on a sec ...', event.replyToken);
    }

    const intentResolver = new IntentResolver();
    const message = await intentResolver.resolveAsText(event.message.text);

    // 4. Reply the message back as text
    const response = await trySendMessage(message, event.replyToken);

    return res.status(response.statusCode).send({
      ok: Number(response.statusCode === 201),
      message: response.body,
    });
  } catch (err) {
    console.log('/bots/webhook', err);
    return res.status(err.code || 400).send(err);
  }
});

module.exports = router;
