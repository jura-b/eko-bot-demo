const mewsService = require('../services/MewsServices.V2');
const impalaService = require('../services/ImpalaService');
const comancheService = require('../services/ComancheService');

class PmsServiceUtil {
  static getService() {
    const name = process.env.PMS_SERVICE_NAME;
    if (!name) {
      throw new Error('PMS Service name is not defined');
    }

    if (name.toLowerCase() === 'mews') {
      return mewsService;
    } else if (name.toLowerCase() === 'impala') {
      return impalaService;
    } else if (name.toLowerCase() === 'comanche') {
      return comancheService;
    }

    throw new Error('Unknown PMS service name');
  }
}

module.exports = PmsServiceUtil;
