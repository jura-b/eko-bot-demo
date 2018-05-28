const router = require('express').Router();

const IntentResolver = require('../lib/IntentResolver.V2');
const DialogFlowService = require('../services/DialogFlowService');
const messageService = require('../services/MessageService');
const StopWatch = require('../lib/StopWatch');

router.post('/webhook', async (req, res) => {
  try {
    // 1. Extract the event
    const event = req.body && req.body.events[0];


    // Tell user to keep calm
    await messageService.messageText('Hold on a sec ...', event.replyToken);

    // 2. Resolve incoming text, these will be your application logic

    // Just capture time to debug performance
    const stopWatch = (new StopWatch()).start();

    let intent;
    if (process.env.ENABLE_DIALOG_FLOW) {
      const dialogFlowService = new DialogFlowService();
      intent = await dialogFlowService.detectIntent(event.message.text);
    } else {
      intent = {
        action: 'input.unknown',
        queryText: event.message.text,
        fulfillmentText: 'This is default message.',
      };
    }

    const intentResolver = new IntentResolver();
    let message = await intentResolver.setIntent(intent).fulfillAsText();

    // Just capture time to debug performance
    stopWatch.stop();
    message = `${message}\n\n(${stopWatch.getTimeConsumed('seconds')} s)`;

    // 3. Reply the message back as text
    const response = await messageService.messageText(message, event.replyToken);
    return res.status(response.statusCode).send({
      ok: response.ok,
      message: response.body.toString(),
    });
  } catch (err) {
    return res.status(err.code || 400).send(err);
  }
});


module.exports = router;
