const moment = require('moment');

class BasePmsService {
  /**
   * Get occupancy rate
   * occupancy rate = sum(occupied room in time period) * 100 / (total room * day count)
   * occupancy rate = 100 - availability rate
   * @param {object} dateTimePeriod
   */
  async getOccupancyRate(dateTimePeriod) {
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
    } catch (err) {
      throw err;
    }

    const [totalRoomCount, absoluteSumOfAvailableRoomCount] = await Promise.all([
      // Rooms
      this.getTotalSpaces(),
      // Sum of room count on everyday
      this.getAbsoluteSumOfRoomAvailabilityCount(dateTimePeriod),
    ]);

    // Find availability rate
    const availabilityRate = (absoluteSumOfAvailableRoomCount * 100) /
      (dateTimePeriod.dayCount * totalRoomCount);

    const occupancyRate = 100 - availabilityRate;
    return occupancyRate;
  }

  /**
   * Get revenue par within period of time
   * revpar = sum(room revenue in time period) / sum(occupied room in time period)
   * @param {object} dateTimePeriod
   */
  async getRevenuePar(dateTimePeriod) {
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
    } catch (err) {
      throw err;
    }

    const [roomRevenue, absoluteSumOfAvailableRoomCount] = await Promise.all([
      // Room revenue
      this.getRoomRevenue(dateTimePeriod),
      // Sum of room count on everyday
      this.getAbsoluteSumOfRoomAvailabilityCount(dateTimePeriod),
    ]);

    return roomRevenue / absoluteSumOfAvailableRoomCount;
  }

  /**
   * Get daily average rate within period of time
   * adr = sum(room revenue in time period) / (total room * day count)
   * @param {object} dateTimePeriod
   */
  async getAverageDailyRate(dateTimePeriod) {
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
    } catch (err) {
      throw err;
    }

    // Query raw data
    const [roomRevenue, totalRoomCount] = await Promise.all([
      // Room revenue
      this.getRoomRevenue(dateTimePeriod),
      // Rooms
      this.getTotalSpaces(),
    ]);

    return roomRevenue / (totalRoomCount * dateTimePeriod.dayCount);
  }

  validateStartEndDateTime(dateTimePeriod) {
    if (dateTimePeriod.end.diff(dateTimePeriod.start) < 0) {
      const error = new Error('Start date exceed end date');
      error.prettyMessage = 'Start date must not exceed end date.';
      error.name = 'MewsServiceDateTimePeriodError';
      throw error;
    }
  }

  validateExceedFuture(dateTimePeriod) {
    const now = moment();
    if (now.diff(dateTimePeriod.end) < 0 && now.diff(dateTimePeriod.start) < 0) {
      const error = new Error('Date exceed future');
      error.prettyMessage = 'Future data not available.';
      error.name = 'MewsServiceDateTimePeriodError';
      throw error;
    }
  }

  static UnsupportFunctionError(functionName) {
    const error = new Error(`Unsupport function, please implement '${functionName}' method`);
    error.prettyMessage = 'Sorry this function hasn\'t been supported yet';
    error.name = 'UnsupportFunctionError';
    return error;
  }


  /**
   * @abstract
   */
  getRoomRevenue() { throw BasePmsService.UnsupportFunctionError('getRoomRevenue'); }

  /**
   * @abstract
   */
  getTotalSpaces() { throw BasePmsService.UnsupportFunctionError('getTotalSpaces'); }

  /**
   * @abstract
   */
  getAbsoluteSumOfRoomAvailabilityCount() { throw BasePmsService.UnsupportFunctionError('getAbsoluteSumOfRoomAvailabilityCount'); }

  /**
   * @abstract
   */
  getServiceIdByName() { throw BasePmsService.UnsupportFunctionError('getServiceIdByName'); }
}

module.exports = BasePmsService;
