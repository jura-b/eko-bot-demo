const BasePmsService = require('./BasePmsService');
const moment = require('moment');
const Impala = require('@get-impala/impala-js').default;
const _ = require('lodash');

class ImpalaService extends BasePmsService {
  constructor() {
    super();
    const credential = ImpalaService.CREDENTIAL;
    const hotel = new Impala(credential);
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

    const revenue = bookings.reduce((acc, { totalCost }) => {
      const sum = acc + totalCost ? totalCost.ammount : 0;
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
    const rooms = await this.hotel.getRooms({ perPage: 10, page: 2 });
    return rooms.records;
  }

  async getAbsoluteSumOfRoomAvailabilityCount(dateTimePeriod) {
    const roomAvailabilities = await this.getRoomAvailabilites(dateTimePeriod);
    const count = roomAvailabilities.reduce((acc, { availableRoomsCount }) => acc + availableRoomsCount, 0);
    return count;
  }

  async getRoomAvailabilites(dateTimePeriod) {
    const roomTypeAvailabilities = await this.getRoomTypeAvailabilities(dateTimePeriod);
    const groupedByDate = _.groupBy(roomTypeAvailabilities, 'date');

    const roomAvailabilities = _.keysIn(groupedByDate).map((timestamp) => {
      const availabilities = groupedByDate[timestamp];
      const count = availabilities.reduce((acc, { availableRoomsCount }) => acc + availableRoomsCount, 0);
      return {
        date: moment(timestamp * 1000).format('YYYY-MM-DD'),
        availableRoomsCount: count,
      };
    });

    return roomAvailabilities;
  }

  async getRoomTypeAvailabilities(dateTimePeriod) {
    const roomTypeAvailabilities = await this.hotel.getRoomTypeAvailabilities({
      startDate: dateTimePeriod.start.format('YYYY-MM-DD'),
      endDate: dateTimePeriod.end.format('YYYY-MM-DD'),
      per_page: 1000,
    });

    return roomTypeAvailabilities.records;
  }

  async getBookings(dateTimePeriod) {
    const bookings = await this.hotel.getBookings({
      startDate: dateTimePeriod.start.format('YYYY-MM-DD'),
      endDate: dateTimePeriod.end.format('YYYY-MM-DD'),
    });
    return bookings ? bookings.records : [];
  }
}

module.exports = new ImpalaService();
