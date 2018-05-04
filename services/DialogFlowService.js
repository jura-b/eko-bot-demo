const dialogflow = require('dialogflow');


class DialogFlowService {
  constructor() {
    this.projectId = process.env.DIALOG_FLOW_PROJECT_ID;
    this.languageCode = 'en';
  }

  async detectIntent(query) {
    const self = this;

    if (!query) throw new Error('No query defined');

    console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    // Instantiates a sessison client
    const sessionClient = new dialogflow.SessionsClient();

    const sessionId = '12345';
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.sessionPath(this.projectId, sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
          languageCode: self.languageCode,
        },
      },
    };
    const response = (await sessionClient.detectIntent(request))[0];
    console.log('​DialogFlowService -> asyncdetectIntent -> response', response.queryResult.parameters.fields);
    return response.queryResult;
  }
}

module.exports = DialogFlowService;
