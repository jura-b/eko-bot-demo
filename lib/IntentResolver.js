const MewsService = require('../services/MewsServices');
const _ = require('lodash');
const joi = require('joi');

const intentSchema = joi.object().keys({
  action: joi.string().required(),
  queryText: joi.string().required(),
  fulfillmentText: joi.string().required(),
}).unknown(true);

const mewsService = new MewsService();

class IntentResolver {
  constructor(intent) {
    if (intent) {
      this.setIntent(intent);
    }
  }

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

      'spa',
      'occupancy',
      'adr',
      'revpar',
      'today',
      'mtd',
      'ytd',
      'all',
    ];
  }
  static get PRETTY_TIME_TEXT() {
    return {
      today: 'Today',
      yesterday: 'Yesterday',
      mtd: 'Month-to-Date',
      ytd: 'Year-to-Date',
    };
  }

  setIntent(intent) {
    this.intent = joi.attempt(intent, intentSchema);
    return this;
  }

  async fulfillAsText() {
    const { intent } = this;
    if (!intent) throw new Error('Undefined intent');

    if (intent.action === 'input.unknown') {
      return this.resolveAsText(intent.queryText);
    } else if (intent.action === 'pms.summary_report.get') {
      return Promise.all(this.parseIntentToString().map(message => this.resolveAsText(message)))
        .then(results => results.join('\n'));
    }
    return intent.fulfillmentText;
  }

  parseIntentToString() {
    const { intent } = this;
    if (!intent) throw new Error('Undefined intent');

    const params = intent.parameters.fields;

    const toDateStringMapper = {
      today: 'today',
      'month to date': 'mtd',
      'year to date': 'ytd',
      'week to date': 'wtd',
    };
    const toDateString = toDateStringMapper[params['to-date-period'].stringValue] || '';

    const reportNameMapper = {
      'occupancy rate': toDateString ? 'occupancy rate' : 'occupancy',
      'average daily rate': 'adr',
      'revenue par': toDateString ? 'rev par' : 'revpar',
    };

    const reportNames = params['report-name'].listValue.values;
    if (reportNames.length) {
      return reportNames.map(({ stringValue }) => _.trim(`${toDateString} ${reportNameMapper[stringValue]}`));
    }
    return [toDateString];
  }

  async resolveAsText(rawMessage, allowAllCommand = true, muteHelp = false) {
    const self = this;
    const words = _.words(rawMessage.toLowerCase());

    if (words.length === 1 && allowAllCommand) {
      const result = await self.resolveSingleWordCommand(words[0]);
      if (result) return result;
    }

    // Parse time identifier
    let time = IntentResolver.PRETTY_TIME_TEXT[words[0]];
    if (!time) time = IntentResolver.PRETTY_TIME_TEXT.today;

    if (words[1] === 'spa' && words[2] === 'revenue' && words.length === 3) {
      const revenue = await mewsService.getRevenue({
        serviceId: MewsService.SPA_SERVICE_ID,
        toDateString: words[0],
      });
      return `${time} Spa Revenue (GBP): ${revenue.toFixed(2).toLocaleString()}`;
    } else if (words[1] === 'occupancy' && words[2] === 'rate' && words.length === 3) {
      const occupancyRate = await mewsService.getRoomOccupancyRate({
        toDateString: words[0],
      });

      return `${time} Occupancy Rate: ${occupancyRate.toFixed(2).toLocaleString()} %`;
    } else if (words[1] === 'adr' && words.length === 2) {
      const adr = await mewsService.getADR({
        toDateString: words[0],
      });

      return `${time} ADR (GBP): ${adr.toFixed(2).toLocaleString()}`;
    } else if (words[1] === 'rev' && words[2] === 'par' && words.length === 3) {
      const revPar = await mewsService.getRevPar({
        toDateString: words[0],
      });

      return `${time} Revenue Par: ${revPar.toFixed(2).toLocaleString()}`;
    } else if (words[0] === 'all' && words.length === 1 && allowAllCommand) {
      const promises = IntentResolver.COMMAND_LIST
        .map(command => self.resolveAsText(command, false, true));
      const results = await Promise.all(promises);
      return results.join('\n');
    }

    return muteHelp ? '' : this.helpText();
  }

  async resolveSingleWordCommand(word) {
    const self = this;
    let commands;
    if (word === 'spa') {
      commands = [
        'today spa revenue',
        'mtd spa revenue',
        'ytd spa revenue',
      ];
    } else if (word === 'occupancy') {
      commands = [
        'today occupancy rate',
        'mtd occupancy rate',
        'ytd occupancy rate',
      ];
    } else if (word === 'adr') {
      commands = [
        'today adr',
        'mtd adr',
        'ytd adr',
      ];
    } else if (word === 'revpar') {
      commands = [
        'today rev par',
        'mtd rev par',
        'ytd rev par',
      ];
    } else if (word === 'today') {
      commands = [
        'today spa revenue',
        'today occupancy rate',
        'today adr',
        'today rev par',
      ];
    } else if (word === 'yesterday') {
      commands = [
        'yesterday spa revenue',
        'yesterday occupancy rate',
        'yesterday adr',
        'yesterday rev par',
      ];
    } else if (word === 'mtd') {
      commands = [
        'mtd spa revenue',
        'mtd occupancy rate',
        'mtd adr',
        'mtd rev par',
      ];
    } else if (word === 'ytd') {
      commands = [
        'ytd spa revenue',
        'ytd occupancy rate',
        'ytd adr',
        'ytd rev par',
      ];
    }

    if (commands && commands.length) {
      const promises = commands.map(command => self.resolveAsText(command, false, true));
      const results = await Promise.all(promises);
      return results.join('\n');
    }
    return null;
  }

  helpText() {
    return IntentResolver.COMMAND_LIST.reduce((message, command) => `${message}- ${command}\n`, 'Available Commands:\n');
  }
}

module.exports = IntentResolver;
