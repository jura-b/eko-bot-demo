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

  const now = new Date();
  now.setDate(now.getDate() - 1);
  const yesterday = now;

  let dateTimePeriod = DateTimeResolver.asDatePeriod(yesterday);
  let reportObjects = [
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('service revenue', { dateTimePeriod, serviceName: 'spa' }, pmsService),
  ];

  dateTimePeriod = DateTimeResolver.asDatePeriod('month to date');
  reportObjects = reportObjects.concat([
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('service revenue', { dateTimePeriod, serviceName: 'spa' }, pmsService),
  ]);

  dateTimePeriod = DateTimeResolver.asDatePeriod('year to date');
  reportObjects = reportObjects.concat([
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod }, pmsService),
    PmsReportUtil.getReportObject('service revenue', { dateTimePeriod, serviceName: 'spa' }, pmsService),
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
    const timeConsumed = stopWatch.stop().getTimeConsumed('seconds');
    await messageService.notifyText(`Daily PMS Report for\n\n${message}`);

    console.info(`Job done: notify-summary-report (${timeConsumed})`);
  }
};
