const request = require('request-promise');
const moment = require('moment');

class MewsService {
  static get SPA_SERVICE_ID() {
    return 'fd34999a-1b21-4790-ad48-72d6ca5dd194';
  }
  static get STAY_SERVICE_ID() {
    return 'bd26d8db-86da-4f96-9efc-e5a4654a4a94';
  }
  static get ACCOMMODATION_ACCOUNTING_CATEGORY_ID() {
    return '0cf7aa90-736f-43e9-a7dc-787704548d86';
  }

  async getAllSpaItems() {
    const items = (await this.getAllItems())
      .filter(item => item.ServiceId === MewsService.SPA_SERVICE_ID);
    return items;
  }

  async getRevenue({ serviceId, toDateString }) {
    const toDate = this.parseToDateStringToTimeUnit(toDateString);
    let items = await this.getAllItems(toDate);
    items = items.filter(item => item.ServiceId === serviceId);

    const revenue = items.reduce((acc, item) => acc + item.Amount.Net, 0);
    return revenue;
  }

  async getRoomRevenue({ toDateString }) {
    const toDate = this.parseToDateStringToTimeUnit(toDateString);
    let items = await this.getAllItems(toDate);
    items = items.filter(item =>
      item.AccountingCategoryId === MewsService.ACCOMMODATION_ACCOUNTING_CATEGORY_ID);

    const revenue = items.reduce((acc, item) => acc + item.Amount.Net, 0);
    return revenue;
  }

  async getRoomOccupancyRate({ toDateString }) {
    const toDate = this.parseToDateStringToTimeUnit(toDateString);
    const totalRoomCount = (await this.getAllSpaces()).length;
    const availability = await this.getServiceAvailability(toDate, MewsService.STAY_SERVICE_ID);
    const dayCount = availability.DatesUtc.length;
    const absoluteAvailableRoomCount = availability.CategoryAvailabilities
      .reduce((acc, item) => acc + item.Availabilities
        .reduce((acc2, spaceCount) => acc2 + spaceCount), 0);

    const availabilityRate = (absoluteAvailableRoomCount * 100) / (dayCount * totalRoomCount);
    return 100 - availabilityRate;
  }

  async getADR({ toDateString }) {
    const roomRevenue = await this.getRoomRevenue({
      toDateString,
    });
    const totalRoomCount = (await this.getAllSpaces()).length;

    const toDate = this.parseToDateStringToTimeUnit(toDateString);
    const dayCount =
      (moment().endOf(toDate).dayOfYear() - moment().startOf(toDate).dayOfYear()) + 1;

    return roomRevenue / (totalRoomCount * dayCount);
  }

  async getRevPar({ toDateString }) {
    const toDate = this.parseToDateStringToTimeUnit(toDateString);

    const roomRevenue = await this.getRoomRevenue({
      toDateString,
    });

    const availability = await this.getServiceAvailability(toDate, MewsService.STAY_SERVICE_ID);
    const absoluteAvailableRoomCount = availability.CategoryAvailabilities
      .reduce((acc, item) => acc + item.Availabilities
        .reduce((acc2, spaceCount) => acc2 + spaceCount), 0);

    return roomRevenue / absoluteAvailableRoomCount;
  }

  async getTotalSpaces() {
    return (await this.getAllSpaces()).Spaces.length;
  }

  async getAllItems(toDate = 'day') {
    const options = {
      uri: 'https://demo.mews.li/api/connector/v1/accountingItems/getAll',
      json: true,
      body: {
        ClientToken: process.env.MEWS_API_CLIENT_TOKEN,
        AccessToken: process.env.MEWS_API_ACCESS_TOKEN,
        StartUtc: moment().startOf(toDate).toISOString(),
        EndUtc: moment().endOf(toDate).toISOString(),
      },
      resolveWithFullResponse: true,
    };
    const response = await request.post(options);
    return response.body.AccountingItems;
  }

  async getAllSpaces() {
    const options = {
      uri: 'https://demo.mews.li/api/connector/v1/spaces/getAll',
      json: true,
      body: {
        ClientToken: process.env.MEWS_API_CLIENT_TOKEN,
        AccessToken: process.env.MEWS_API_ACCESS_TOKEN,
      },
      resolveWithFullResponse: true,
    };
    const response = await request.post(options);
    return response.body.Spaces;
  }

  async getServiceAvailability(toDate = 'day', serviceId) {
    const options = {
      uri: 'https://demo.mews.li/api/connector/v1/services/getAvailability',
      json: true,
      body: {
        ClientToken: process.env.MEWS_API_CLIENT_TOKEN,
        AccessToken: process.env.MEWS_API_ACCESS_TOKEN,
        ServiceId: serviceId,
        StartUtc: moment().startOf(toDate).toISOString(),
        EndUtc: moment().endOf(toDate).toISOString(),
      },
      resolveWithFullResponse: true,
    };
    const response = await request.post(options);
    return response.body;
  }

  parseToDateStringToTimeUnit(toDateString) {
    switch (toDateString) {
      case 'today':
        return 'day';
      case 'mtd':
        return 'month';
      case 'ytd':
        return 'year';
      default:
        return 'day';
    }
  }
}

module.exports = MewsService;

