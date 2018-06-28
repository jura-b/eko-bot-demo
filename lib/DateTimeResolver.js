const joi = require('joi');
const moment = require('moment');
const _ = require('lodash');

const DAY_IN_MS = 1000 * 60 * 60 * 24;

class DateTimeResolver {
  static asDatePeriod(input) {
    console.debug('​DateTimeResolver -> staticasDatePeriod -> input', input);

    if (input === '') {
      // assume it is today
      return {
        start: moment().utc().startOf('day'),
        end: moment().utc(),
        prettyString: 'Today',
        type: 'today',
        dayCount: 1,
      };
    } else if (!joi.validate(input, joi.date()).error) {
      // for date
      const date = moment(input).utc();
      if (!date.isValid()) throw new Error('Invalid input: date');

      return {
        start: date.startOf('day'),
        end: date.startOf('day'),
        prettyString: date.format('ddd, Do MMM YY'),
        type: 'date',
        dayCount: 1,
      };
    } else if (!joi.validate(input, joi.string()).error) {
      // for to-date-period
      const toDateParser = {
        today: 'day',
        'week to date': 'week',
        'month to date': 'month',
        'year to date': 'year',
      };
      const dateTimeUnit = toDateParser[input];
      if (!dateTimeUnit) throw new Error('Invalid input: to-date-period');

      const startDate = moment().utc().startOf(dateTimeUnit);
      const endDate = moment().utc();
      return {
        start: startDate,
        end: endDate,
        prettyString: _.upperFirst(_.kebabCase(input)),
        type: `${dateTimeUnit}-to-date`,
        dayCount: Math.ceil((endDate.diff(startDate) + 1) / DAY_IN_MS),
      };
    } else if (!joi.validate(
      input,
      joi.object({ startDate: joi.date(), endDate: joi.date() }),
    ).error) {
      // for date-period
      const startDate = moment(input.startDate).utc();
      const endDate = moment(input.endDate).utc();
      if (!(startDate.isValid() && endDate.isValid())) throw new Error('Invalid input: date-period');

      return {
        start: startDate.startOf('day'),
        end: endDate.startOf('day'),
        prettyString: `${startDate.format('Do MMM YY')} - ${endDate.format('Do MMM YY')}`,
        type: 'date-period',
        dayCount: Math.ceil((endDate.diff(startDate) + 1) / DAY_IN_MS),
      };
    }

    throw new Error('Invalid input');
  }
}

module.exports = DateTimeResolver;
