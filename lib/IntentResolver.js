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
  static get COMMAND_LIST() {
    return [
      'today spa revenue',
      'mtd spa revenue',
      'ytd spa revenue',
      'today occupancy rate',
      'mtd occupancy rate',
      'ytd occupancy rate',
      'today adr',
      'mtd adr',
      'ytd adr',
      'today rev par',
      'mtd rev par',
      'ytd rev par',
      'all',
    ];
  }
  async resolveAsText(rawMessage, allowAllCommand = true, muteHelp = false) {
    const words = _.words(rawMessage.toLowerCase());
    if (words[1] === 'spa' && words[2] === 'revenue' && words.length === 3) {
      const revenue = await mewsService.getRevenue({
        serviceId: MewsService.SPA_SERVICE_ID,
        toDateString: words[0],
      });

      return `Spa Revenue (GBP): ${revenue.toFixed(2).toLocaleString()}`;
    } else if (words[1] === 'occupancy' && words[2] === 'rate' && words.length === 3) {
      const occupancyRate = await mewsService.getRoomOccupancyRate({
        toDateString: words[0],
      });

      return `Occupancy Rate: ${occupancyRate.toFixed(2).toLocaleString()} %`;
    } else if (words[1] === 'adr' && words.length === 2) {
      const adr = await mewsService.getADR({
        toDateString: words[0],
      });

      return `ADR (GBP): ${adr.toFixed(2).toLocaleString()}`;
    } else if (words[1] === 'rev' && words[2] === 'par' && words.length === 3) {
      const revPar = await mewsService.getRevPar({
        toDateString: words[0],
      });

      return `Revenue Par: ${revPar.toFixed(2).toLocaleString()}`;
    } else if (words[0] === 'all' && words.length === 1 && allowAllCommand) {
      const self = this;
      const promises = IntentResolver.COMMAND_LIST
        .map(command => self.resolveAsText(command, false, true));
      const results = await Promise.all(promises);
      return results.join('\n');
    }

    return muteHelp ? '' : this.helpText();
  }

  helpText() {
    return IntentResolver.COMMAND_LIST.reduce((message, command) => `${message}- ${command}\n`, 'Available Commands:\n');
  }
}

module.exports = IntentResolver;
