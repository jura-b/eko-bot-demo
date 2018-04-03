const MewsService = require('../services/MewsServices');
const _ = require('lodash');

const mewsService = new MewsService();

class IntentResolver {
  static get HELP() {
    return 'Available Commands:\n' +
      '- today spa revenue\n' +
      '- mtd spa revenue\n' +
      '- ytd spa revenue\n' +
      '- today occupancy rate\n' +
      '- mtd occupancy rate\n' +
      '- ytd occupancy rate\n' +
      '- today adr\n' +
      '- mtd adr\n' +
      '- ytd adr\n' +
      '- today rev par\n' +
      '- mtd rev par\n' +
      '- ytd rev par\n';
  }
  async resolveAsText(rawMessage) {
    const words = _.words(rawMessage.toLowerCase());
    if (words[1] === 'spa' && words[2] === 'revenue') {
      const revenue = await mewsService.getRevenue({
        serviceId: MewsService.SPA_SERVICE_ID,
        toDateString: words[0],
      });

      return `Spa Revenue (GBP): ${revenue.toFixed(2).toLocaleString()}`;
    } else if (words[1] === 'occupancy' && words[2] === 'rate') {
      const occupancyRate = await mewsService.getRoomOccupancyRate({
        toDateString: words[0],
      });

      return `Occupancy Rate: ${occupancyRate.toFixed(2).toLocaleString()} %`;
    } else if (words[1] === 'adr') {
      const adr = await mewsService.getADR({
        toDateString: words[0],
      });

      return `ADR (GBP): ${adr.toFixed(2).toLocaleString()}`;
    } else if (words[1] === 'rev' && words[2] === 'par') {
      const revPar = await mewsService.getRevPar({
        toDateString: words[0],
      });

      return `Revenue Par: ${revPar.toFixed(2).toLocaleString()}`;
    }

    return IntentResolver.HELP;
  }
}

module.exports = IntentResolver;
