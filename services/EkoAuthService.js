const ClientOAuth2 = require('client-oauth2');

const LEEWAY = 60 * 1000; // 60 secs

class EkoAuthService {
  constructor() {
    const ekoAuth = new ClientOAuth2({
      clientId: process.env.EKO_OAUTH_CLIENT_ID,
      clientSecret: process.env.EKO_OAUTH_CLIENT_SECRET,
      accessTokenUri: `${process.env.EKO_HTTP_URI}/oauth/token`,
      scopes: ['bot'],
    });
    this.client = ekoAuth;
  }

  async getToken() {
    const now = new Date().getTime();

    const tokenData = this.token && this.token.data;
    if (tokenData) {
      const isAlive = ((this.grantTimeStamp + (tokenData.expires_in * 1000)) - LEEWAY) > now;
      if (isAlive) return tokenData.access_token;
    }

    this.grantTimeStamp = now;
    this.token = await this.client.credentials.getToken();

    return this.token.data.access_token;
  }
}

module.exports = new EkoAuthService();
