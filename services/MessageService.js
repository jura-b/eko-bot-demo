const request = require('request-promise');
const auth = require('./EkoAuthService');


class MessageService {
  getDefaultRequestOption() {
    return {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      json: true,
      resolveWithFullResponse: true,
    };
  }

  async authenticate() {
    this.accessToken = await auth.getToken();
  }

  async notifyText(text, attempt = 0) {
    if (attempt > 2) {
      return this.internalServerErrorResponse('Request re-attempt reaches limit.');
    }
    attempt += 1;

    let response;
    try {
      response = await this.sendNotifyTextRequest(text);
    } catch (err) {
      const statusCode = (response && response.statusCode) || (err && err.statusCode);
      if (statusCode === 401) {
        await this.authenticate();
        return this.notifyText(text, false);
      }
    }

    return this.parseResponse(response);
  }

  async messageText(text, replyToken, attempt = 0) {
    if (attempt > 2) {
      return this.internalServerErrorResponse('Request re-attempt reaches limit.');
    }
    attempt += 1;

    let response;
    try {
      response = await this.sendMessageTextRequest(text, replyToken);
    } catch (err) {
      const statusCode = (response && response.statusCode) || (err && err.statusCode);
      if (statusCode === 401) {
        await this.authenticate();
        return this.messageText(text, replyToken, attempt);
      }
    }

    return this.parseResponse(response);
  }

  async sendNotifyTextRequest(text) {
    if (!this.accessToken) await this.authenticate();

    const options = {
      uri: `${process.env.EKO_HTTP_URI}/bot/v1/notify/text`,
      body: { message: text },
      ...this.getDefaultRequestOption(),
    };
    return request.post(options);
  }

  async sendMessageTextRequest(text, replyToken) {
    if (!this.accessToken) await this.authenticate();

    const options = {
      uri: `${process.env.EKO_HTTP_URI}/bot/v1/message/text`,
      body: { message: text, replyToken },
      ...this.getDefaultRequestOption(),
    };
    return request.post(options);
  }

  parseResponse(response) {
    return {
      statusCode: response.statusCode,
      body: response.body ? response.body : '',
      ok: Math.floor(response.statusCode / 100) === 2,
    };
  }

  internalServerErrorResponse(message) {
    return {
      statusCode: 500,
      body: message,
      ok: false,
    };
  }
}

module.exports = new MessageService();
