const request = require('request-promise');
const BasePmsService = require('./BasePmsService');

class MewsService extends BasePmsService {
  static get SPA_SERVICE_ID() {
    return 'fd34999a-1b21-4790-ad48-72d6ca5dd194';
  }
  static get STAY_SERVICE_ID() {
    return 'bd26d8db-86da-4f96-9efc-e5a4654a4a94';
  }
  static get ACCOMMODATION_ACCOUNTING_CATEGORY_ID() {
    return '0cf7aa90-736f-43e9-a7dc-787704548d86';
  }

  /**
   * Get sum of defined service revenue within period of time
   * @param {object} dateTimePeriod
   * @param {string} serviceId
   */
  async getServiceRevenue(dateTimePeriod, args) {
    const { serviceName } = args;
    let serviceId;
    try {
      this.validateStartEndDateTime(dateTimePeriod);
      this.validateExceedFuture(dateTimePeriod);
      serviceId = await this.getServiceIdByName(serviceName);
    } catch (err) {
      throw err;
    }

    let items = await this.getAllItems(dateTimePeriod);
    items = items.filter(item => item.ServiceId === serviceId);

    const revenue = items.reduce((acc, item) => acc + item.Amount.Net, 0);
    return revenue;
  }

  async getAbsoluteSumOfRoomAvailabilityCount(dateTimePeriod) {
    return this.getAbsoluteSumOfServiceAvailablityCount(dateTimePeriod, MewsService.STAY_SERVICE_ID);
  }

  /**
   * Get sum of service availabilty within period of time
   * @param {object} dateTimePeriod
   * @param {string} serviceId
   */
  async getAbsoluteSumOfServiceAvailablityCount(dateTimePeriod, serviceId) {
    const { CategoryAvailabilities } = await this.getServiceAvailability(dateTimePeriod, serviceId);

    return CategoryAvailabilities.reduce((acc, { Availabilities }) => {
      const sumOfAvailableRoomCount = Availabilities
        .reduce((acc2, spaceCount) => acc2 + spaceCount, 0);
      return acc + sumOfAvailableRoomCount;
    }, 0);
  }

  /**
   * Get sum of accommodation revenue within period of time
   * @param {object} dateTimePeriod
   */
  async getRoomRevenue(dateTimePeriod) {
    let items = await this.getAllItems(dateTimePeriod);
    items = items.filter(item =>
      item.AccountingCategoryId === MewsService.ACCOMMODATION_ACCOUNTING_CATEGORY_ID);

    const revenue = items.reduce((acc, item) => acc + item.Amount.Net, 0);
    return revenue;
  }

  /**
   * Get total room count
   */
  async getTotalSpaces() {
    const spaces = await this.getAllSpaces();
    return spaces.length;
  }

  async getAllSpaItems() {
    const items = (await this.getAllItems())
      .filter(item => item.ServiceId === MewsService.SPA_SERVICE_ID);
    return items;
  }


  async getAllItems(dateTimePeriod) {
    const options = {
      uri: 'https://demo.mews.li/api/connector/v1/accountingItems/getAll',
      json: true,
      body: {
        ClientToken: process.env.MEWS_API_CLIENT_TOKEN,
        AccessToken: process.env.MEWS_API_ACCESS_TOKEN,
        StartUtc: dateTimePeriod.start.toISOString(),
        EndUtc: dateTimePeriod.end.toISOString(),
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

  async getServiceAvailability(dateTimePeriod, serviceId) {
    const options = {
      uri: 'https://demo.mews.li/api/connector/v1/services/getAvailability',
      json: true,
      body: {
        ClientToken: process.env.MEWS_API_CLIENT_TOKEN,
        AccessToken: process.env.MEWS_API_ACCESS_TOKEN,
        ServiceId: serviceId,
        StartUtc: dateTimePeriod.start.toISOString(),
        EndUtc: dateTimePeriod.end.toISOString(),
      },
      resolveWithFullResponse: true,
    };
    const response = await request.post(options);
    return response.body;
  }

  async getServiceIdByName(serviceName) {
    const mapper = {
      spa: MewsService.SPA_SERVICE_ID,
    };

    const serviceId = mapper[serviceName];
    if (serviceId) {
      return serviceId;
    }

    throw new Error('Service not found.');
  }
}

module.exports = new MewsService();
