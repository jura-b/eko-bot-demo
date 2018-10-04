const request = require('request-promise');
const BasePmsService = require('./BasePmsService');
const _ = require('lodash');

class ComancheService extends BasePmsService {
  constructor() {
    super();
    this.credential = ComancheService.CREDENTIAL;
    this.endpointInfo = ComancheService.ENDPOINT_INFO;
  }

  static get CREDENTIAL() {
    return {
      clientId: process.env.COMANCHE_CLIENT_ID,
      clientReadSecret: process.env.COMANCHE_CLIENT_READ_SECRET,
    };
  }

  static get ENDPOINT_INFO() {
    return {
      dataEndpointUrl: process.env.COMANCHE_DATA_ENDPOINT_URL,
    };
  }

  getDefaultRequestOption() {
    return {
      auth: {
        user: this.credential.clientId,
        pass: this.credential.clientReadSecret,
      },
      json: true,
      resolveWithFullResponse: true,
    };
  }

  async getDailyData(dateTimePeriod) {
    const dailyDataDate = dateTimePeriod.end.format('YYYY-MM-DD');

    let dailyDataResponse;
    try {
      dailyDataResponse = await this.sendGetDailyDataRequest(dailyDataDate);
    } catch (err) {
      const statusCode = (dailyDataResponse && dailyDataResponse.statusCode) || (err && err.statusCode);

      if (statusCode === 404) {
        throw this.constructor.DataNotAvailableError(dailyDataDate, `${dailyDataDate}'s data may not be ready yet.`);
      }
      throw err;
    }

    return dailyDataResponse.body;
  }

  getSMDashboardKey(dateTimePeriod) {
    const { type: dateTimeType } = dateTimePeriod;

    if (['date', 'today', 'day-to-date', 'ttd'].includes(dateTimeType)) {
      return 'Today';
    } else if (['month', 'month-to-date', 'mtd'].includes(dateTimeType)) {
      return 'MTD';
    } else if (['year', 'year-to-date', 'ytd'].includes(dateTimeType)) {
      return 'YTD';
    } else if (dateTimeType === 'date-period') {
      if (dateTimePeriod.start.date() !== 1) {
        throw this.constructor.UnsupportDateTimePeriodError('Bad date period (MTD)', 'Comanche data only support TTD, MTD, and YTD');
      }
      if (dateTimePeriod.dayCount === 1) {
        return 'Today';
      } else if (dateTimePeriod.dayCount <= 31) {
        return 'MTD';
      } else if (dateTimePeriod.dayCount > 31) {
        if (dateTimePeriod.start.month() === 0) {
          return 'YTD';
        }
        throw this.constructor.UnsupportDateTimePeriodError('Bad date period (YTD)', 'Comanche data only support TTD, MTD, and YTD');
      }
    }
    throw this.constructor.UnsupportDateTimePeriodError('Unknown date time type', 'Comanche data only support TTD, MTD, and YTD');
  }

  async sendGetDailyDataRequest(dateString) {
    const options = {
      ...this.getDefaultRequestOption(),
      uri: `${this.endpointInfo.dataEndpointUrl}/api/v1/daily-data/${dateString}`,
    };
    return request.get(options);
  }

  /**
   * Get occupancy rate
   * @param {object} dateTimePeriod
   */
  async getOccupancyRate(dateTimePeriod) {
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
    } catch (err) {
      throw err;
    }

    const roomCount = process.env.COMANCHE_ROOM_COUNT;
    const periodPrefix = this.getSMDashboardKey(dateTimePeriod);
    const dailyData = await this.getDailyData(dateTimePeriod);
    const dataKey = `sm_dashboard.${periodPrefix}Occ`;
    const occupancyCount = _.get(dailyData, dataKey);
    if (['string', 'number'].includes(typeof occupancyCount)) {
      const occupancyRate = Number(occupancyCount) / (dateTimePeriod.dayCount * roomCount);
      return occupancyRate;
    }

    const dailyDataDate = dateTimePeriod.end.format('YYYY-MM-DD');
    throw this.constructor.DataIncompleteError(
      `Key ${dataKey} of ${dailyDataDate} is not found`,
      `${dailyDataDate}'s data may not complete.`,
    );
  }

  /**
   * Get revenue par within period of time
   * @param {object} dateTimePeriod
   */
  async getRevenuePar(dateTimePeriod) {
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
    } catch (err) {
      throw err;
    }

    const periodPrefix = this.getSMDashboardKey(dateTimePeriod);
    const dailyData = await this.getDailyData(dateTimePeriod);
    const dataKey = `sm_dashboard.${periodPrefix}RevPar`;
    const revenuePar = _.get(dailyData, dataKey);
    if (['string', 'number'].includes(typeof revenuePar)) {
      return revenuePar;
    }

    const dailyDataDate = dateTimePeriod.end.format('YYYY-MM-DD');
    throw this.constructor.DataIncompleteError(
      `Key ${dataKey} of ${dailyDataDate} is not found`,
      `${dailyDataDate}'s data may not complete.`,
    );
  }

  /**
   * Get daily average rate within period of time
   * @param {object} dateTimePeriod
   */
  async getAverageDailyRate(dateTimePeriod) {
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
    } catch (err) {
      throw err;
    }
    const periodPrefix = this.getSMDashboardKey(dateTimePeriod);
    const dailyData = await this.getDailyData(dateTimePeriod);
    const dataKey = `sm_dashboard.${periodPrefix}ADR`;
    const avergaeDailyRate = _.get(dailyData, dataKey);
    if (['string', 'number'].includes(typeof avergaeDailyRate)) {
      return avergaeDailyRate;
    }

    const dailyDataDate = dateTimePeriod.end.format('YYYY-MM-DD');
    throw this.constructor.DataIncompleteError(
      `Key ${dataKey} of ${dailyDataDate} is not found`,
      `${dailyDataDate}'s data may not complete.`,
    );
  }
}

module.exports = new ComancheService();
