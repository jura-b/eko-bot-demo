const BasePmsService = require('./BasePmsService');
const moment = require('moment');
const _ = require('lodash');
const request = require('request-promise-native');

class ImpalaSDK {
  constructor(credential) {
    this.apiKey = credential.apiKey;
    this.hotelId = credential.hotelId;
  }

  async getRequest(path, params = {}, meta = {}) {
    const options = {
      uri: `https://api.getimpala.com/v2/hotel/${this.hotelId}/${path}`,
      qs: {
        ...params,
        ...meta,
      },
      auth: {
        bearer: this.apiKey,
      },
      resolveWithFullResponse: true,
      json: true,
    };
    try {
      const { body } = await request.get(options);
      return (body);
    } catch (err) {
      throw err;
    }
  }

  async getRooms() {
    try {
      const responseBody = await this.getRequest('area', {}, {
        limit: 1000,
      });
      return _.get(responseBody, 'data', []);
    } catch (err) {
      throw err;
    }
  }

  async getBookings(params) {
    try {
      const dayBuffer = 15;
      const parsedParams = {
        ...params,
        startDate: moment(params.startDate).subtract(dayBuffer, 'd').format('YYYY-MM-DD'),
        endDate: moment(params.endDate).add(dayBuffer, 'd').format('YYYY-MM-DD'),
      };

      // Fetch bookings within buffered range
      let bookingList = [];
      let hasNextPage;
      let nextPage = null;
      do {
        const responseBody = await this.getRequest('booking', parsedParams, {
          limit: 1000,
          next: nextPage,
        });
        bookingList = bookingList.concat(_.get(responseBody, 'data', []));

        hasNextPage = _.get(responseBody, '_meta.hasNext', false);
        nextPage = _.get(responseBody, '_meta.next', null);
      } while (hasNextPage);

      // Filter out off-range bookings
      bookingList = bookingList.filter((b) => {
        const start = moment.unix(b.start).startOf('d');
        const end = moment.unix(b.end).endOf('d');

        const isStartInRange = start.isBetween(
          params.startDate,
          params.end,
          null, '[]',
        );
        const isEndInRange = end.isBetween(
          params.startDate,
          params.endDate,
          null, '[]',
        );
        const isValid = isStartInRange || isEndInRange;
        if (isValid) {
          if (!isStartInRange) {
            b.start = moment(params.startDate).unix();
          } else if (!isEndInRange) {
            b.end = moment(params.endDate).unix();
          }

          // TODO: If needed, recalculate the portion of net amount
        }

        return isValid;
      });


      return bookingList;
    } catch (err) {
      throw err;
    }
  }


  async getRoomTypeAvailabilities(params) {
    try {
      const responseBody = await this.getRequest('avai', params, {
        limit: 1000,
      });
      return _.get(responseBody, 'data', []);
    } catch (err) {
      throw err;
    }
  }
}

class ImpalaService extends BasePmsService {
  constructor() {
    super();
    const credential = ImpalaService.CREDENTIAL;
    const hotel = new ImpalaSDK(credential);
    this.hotel = hotel;
  }

  static get CREDENTIAL() {
    return {
      apiKey: process.env.IMPALA_API_KEY,
      hotelId: process.env.IMPALA_HOTEL_ID,
    };
  }

  /**
   * @override
   * Get sum of accommodation revenue within period of time
   * @param {object} dateTimePeriod
   */
  async getRoomRevenue(dateTimePeriod) {
    const bookings = await this.getBookings(dateTimePeriod);

    const revenue = bookings.reduce((acc, { netAmount }) => {
      const sum = acc + netAmount ? netAmount : 0;
      return sum;
    }, 0);
    return revenue;
  }

  /**
   * Get total room count
   */
  async getTotalSpaces() {
    const spaces = await this.getAllRooms();
    return spaces.length;
  }


  async getAllRooms() {
    const rooms = await this.hotel.getRooms();
    return rooms;
  }

  async getAbsoluteSumOfRoomAvailabilityCount(dateTimePeriod) {
    const [totalRoom, occupancyTable] = await Promise.all([
      this.getTotalSpaces(dateTimePeriod),
      this.getRoomOccupancyTable(dateTimePeriod),
    ]);

    let occupancyCount = 0;
    Object.keys(occupancyTable).forEach((date) => {
      occupancyCount += occupancyTable[date];
    });

    return (totalRoom * dateTimePeriod.dayCount) - occupancyCount;
  }

  async getRoomOccupancyTable(dateTimePeriod) {
    const bookings = (await this.getBookings(dateTimePeriod))
      .filter(b => ['CHECKED_IN', 'CHECKED_OUT'].includes(b.status));

    const bookingTable = this.getBookingTable(bookings);
    console.log('​asyncgetRoomAvailabilites -> bookingTable', bookingTable);
    return bookingTable;
  }

  getBookingTable(bookings) {
    const bookingTable = {};
    bookings.forEach((booking) => {
      const bookingStart = moment(booking.start);
      const bookingEnd = moment(booking.end);
      while (bookingEnd.diff(bookingStart) > 0) {
        if (!bookingTable[bookingStart.format('YYYY-MM-DD')]) {
          bookingTable[bookingStart.format('YYYY-MM-DD')] = 0;
        }
        bookingTable[bookingStart.format('YYYY-MM-DD')] += 1;
        bookingStart.add(1, 'd');
      }
    });
    return bookingTable;
  }

  async getRoomTypeAvailabilities(dateTimePeriod) {
    const roomTypeAvailabilities = await this.hotel.getRoomTypeAvailabilities({
      startDate: dateTimePeriod.start.format('YYYY-MM-DD'),
      endDate: dateTimePeriod.end.format('YYYY-MM-DD'),
    });

    return roomTypeAvailabilities.records;
  }

  async getBookings(dateTimePeriod) {
    const bookings = await this.hotel.getBookings({
      startDate: dateTimePeriod.start.format('YYYY-MM-DD'),
      endDate: dateTimePeriod.end.format('YYYY-MM-DD'),
    });
    return bookings;
  }
}


module.exports = new ImpalaService();
