const { scheduleJob, RecurrenceRule } = require('node-schedule');
const _ = require('lodash');

class ScheduleReportService {
  setSchedule(timeObject) {
    const rule = new RecurrenceRule();
    _.assign(rule, timeObject);
    this.scheduleRule = rule;
  }

  start(jobFunction) {
    this.activeJob = scheduleJob(this.scheduleRule, jobFunction);
  }

  kill() {
    this.activeJob.cancel();
  }
}

module.exports = ScheduleReportService;
