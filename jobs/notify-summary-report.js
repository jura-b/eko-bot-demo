const messageService = require('../services/MessageService');
const PmsReportUtil = require('../utilities/PmsReportUtil');
const PmsServiceUtil = require('../utilities/PmsServiceUtil');
const DateTimeResolver = require('../lib/DateTimeResolver');
const StopWatch = require('../lib/StopWatch');
const moment = require('moment');
// const mewsService = require('../services/MewsServices.V2');

const generateReportSection = (header, resultArray) => [header]
  .concat(resultArray.map(PmsReportUtil.prettifyReportObject))
  .join('\n');


module.exports = async () => {
  console.info('Executing job: notify-summary-report');

  const stopWatch = (new StopWatch()).start();

  const pmsService = PmsServiceUtil.getService();

  const now = new Date();
  now.setDate(now.getDate() - 1);
  const yesterday = now;

  const yesterdayPeriod = DateTimeResolver.asDatePeriod(yesterday);
  const monthPeriod = DateTimeResolver.asDatePeriod('month to date');
  const yearPeriod = DateTimeResolver.asDatePeriod('year to date');

  const ocrReportObjects = [
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod: yesterdayPeriod }, pmsService),
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod: monthPeriod }, pmsService),
    PmsReportUtil.getReportObject('occupancy rate', { dateTimePeriod: yearPeriod }, pmsService),
  ];

  const adrReportObjects = [
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod: yesterdayPeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod: monthPeriod }, pmsService),
    PmsReportUtil.getReportObject('average daily rate', { dateTimePeriod: yearPeriod }, pmsService),
  ];

  const revParReportObjects = [
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod: yesterdayPeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod: monthPeriod }, pmsService),
    PmsReportUtil.getReportObject('revenue par', { dateTimePeriod: yearPeriod }, pmsService),
  ];

  const serviceReportObjects = [
    PmsReportUtil.getReportObject('service revenue', { dateTimePeriod: yesterdayPeriod, serviceName: 'spa' }, pmsService),
    PmsReportUtil.getReportObject('service revenue', { dateTimePeriod: monthPeriod, serviceName: 'spa' }, pmsService),
    PmsReportUtil.getReportObject('service revenue', { dateTimePeriod: yearPeriod, serviceName: 'spa' }, pmsService),
  ];

  let message;
  try {
    const todayDate = moment().format('ddd, Do MMM YY');
    const [ocrResult, adrResult, revParResult, serviceResult] = await Promise.all([
      Promise.all(ocrReportObjects.map(PmsReportUtil.executeReportAsObject)),
      Promise.all(adrReportObjects.map(PmsReportUtil.executeReportAsObject)),
      Promise.all(revParReportObjects.map(PmsReportUtil.executeReportAsObject)),
      Promise.all(serviceReportObjects.map(PmsReportUtil.executeReportAsObject)),
    ]);

    console.log(ocrResult.map(PmsReportUtil.prettifyReportObject));
    message = [
      `Daily PMS Report for ${todayDate}`,
      generateReportSection('Occupancy Rate', ocrResult),
      generateReportSection('Average Daily Rate', adrResult),
      generateReportSection('Revenue Par', revParResult),
      generateReportSection('Revenue Centers (total 1)', serviceResult),
    ].join('\n\n');
  } catch (err) {
    message = `An error has occured: ${err.toString()}`;
    console.info(`Job Error: notify-summary-report (${err.message})`);
  } finally {
    const timeConsumed = stopWatch.stop().getTimeConsumed('seconds');
    await messageService.notifyText(message);

    console.info(`Job done: notify-summary-report (${timeConsumed})`);
  }
};
