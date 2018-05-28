const messageService = require('../services/MessageService');
const PmsReportUtil = require('../utilities/PmsReportUtil');
const PmsServiceUtil = require('../utilities/PmsServiceUtil');
const DateTimeResolver = require('../lib/DateTimeResolver');
const StopWatch = require('../lib/StopWatch');
// const mewsService = require('../services/MewsServices.V2');

module.exports = async () => {
  console.info('Executing job: notify-summary-report');

  const stopWatch = (new StopWatch()).start();

  const pmsService = PmsServiceUtil.getService();

  let dateTimePeriod = DateTimeResolver.asDatePeriod('today');
  let reportObjects = [
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod }, pmsService),
  ];

  dateTimePeriod = DateTimeResolver.asDatePeriod('month to date');
  reportObjects = reportObjects.concat([
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod }, pmsService),
  ]);

  dateTimePeriod = DateTimeResolver.asDatePeriod('year to date');
  reportObjects = reportObjects.concat([
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod }, pmsService),
  ]);

  let message;
  try {
    const calculationResults = await Promise.all(reportObjects.map(PmsReportUtil.executeReport));
    calculationResults.forEach((r, i) => PmsReportUtil.assignResult(reportObjects[i], r));
    message = reportObjects.map(PmsReportUtil.prettifyReportObject).join('\n');
  } catch (err) {
    message = `An error has occured: ${err.toString()}`;
    console.info(`Job Error: notify-summary-report (${err.message})`);
  } finally {
    await messageService.notifyText(`${message}\n\n(${stopWatch.stop().getTimeConsumed('seconds')} s)`);

    console.info(`Job done: notify-summary-report (${stopWatch.getTimeConsumed('seconds')})`);
  }
};
