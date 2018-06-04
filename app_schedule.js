// load .env
require('dotenv').config();

const ScheduleReportService = require('./services/ScheduleReportService');

const scheduleReportService = new ScheduleReportService();
scheduleReportService.setSchedule({
  minute: 0,
});

scheduleReportService.start(require('./jobs/notify-summary-report'));
require('./jobs/notify-summary-report')();
