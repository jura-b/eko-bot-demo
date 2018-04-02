const MewsService = require('../services/MewsServices');
const _ = require('lodash');

const mewsService = new MewsService();

class IntentResolver {
  async resolveAsText(rawMessage) {
    const words = _.words(rawMessage.toLowerCase());
    if (words[1] === 'spa' && words[2] === 'revenue') {
      const revenue = await mewsService.getRevenue({
        serviceId: MewsService.SPA_SERVICE_ID,
        toDateString: words[0],
      });
      return `Spa Revenue (GBP): ${revenue}`;
    } else if (words[1] === 'occupancy' && words[2] === 'rate') {
      const occupancyRate = await mewsService.getRoomOccupancyRate({
        toDateString: words[0],
      });
      return `Occupancy Rate: ${occupancyRate} %`;
    } else if (words[1] === 'adr') {
      const adr = await mewsService.getADR({
        toDateString: words[0],
      });
      return `ADR (GBP): ${adr}`;
    } else if (words[1] === 'rev' && words[2] === 'par') {
      const revPar = await mewsService.getRevPar({
        toDateString: words[0],
      });
      return `Revenue Par: ${revPar}`;
    }

    return "Sorry, I dont't understand.";
  }
}

module.exports = IntentResolver;
