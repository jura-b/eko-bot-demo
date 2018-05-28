const moment = require('moment');

class StopWatch {
  start() {
    // reinitialized
    this.totalTimeConsumed = null;

    if (this.begin) throw new Error('Watch has already been started, please reset before start again.');

    this.begin = moment();
    return this;
  }

  restart() {
    this.reset();
    return this.start();
  }

  stop() {
    if (!this.begin) throw new Error('Watch has not been started yet.');
    if (this.done) throw new Error('Watch has already been stoped.');

    this.done = moment();
    this.totalTimeConsumed = this.getTimeDifference();
    return this;
  }

  reset() {
    this.begin = null;
    this.done = null;
    return this;
  }

  getTimeConsumed(unit = null) {
    if (this.totalTimeConsumed) {
      if (unit) {
        const funcName = `as${unit.charAt(0).toUpperCase()}${unit.slice(1)}`;
        const timeDuration = moment.duration(this.totalTimeConsumed);
        if (typeof timeDuration[funcName] === 'function') {
          return timeDuration[funcName]();
        }
        throw new Error('Bad time unit');
      } else {
        return this.totalTimeConsumed;
      }
    }
    throw new Error('Watch has not been stopped yet.');
  }

  getTimeDifference() {
    if (this.done && this.begin) {
      return this.done.diff(this.begin);
    }

    throw new Error('Watch has not been start and/or stop.');
  }
}

module.exports = StopWatch;
