const ClientOAuth2 = require('client-oauth2');

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

    if (this.accessToken) {
      const isAlive = (this.grantTimeStamp + (this.accessToken.expires_in * 1000)) > now;
      if (isAlive) return this.accessToken.access_token;
    }

    this.grantTimeStamp = now;
    const { data } = await this.client.credentials.getToken();
    this.accessToken = data;

    return data.access_token;
  }
}

module.exports = new EkoAuthService();
