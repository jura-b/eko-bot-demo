// load .env
require('dotenv').config();

const ScheduleReportService = require('./services/ScheduleReportService');

const scheduleReportService = new ScheduleReportService();
const schedule = {};

if (process.env.SCHEDULE_HOUR) {
  schedule.hour = Number(process.env.SCHEDULE_HOUR);
}
if (process.env.SCHEDULE_MINUTE) {
  schedule.minute = Number(process.env.SCHEDULE_MINUTE);
}

scheduleReportService.setSchedule(schedule);

scheduleReportService.start(require('./jobs/notify-summary-report'));
require('./jobs/notify-summary-report')();
