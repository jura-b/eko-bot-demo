const PmsReportUtil = require('../utilities/PmsReportUtil');
const PmsServiceUtil = require('../utilities/PmsServiceUtil');
const DateTimeResolver = require('./DateTimeResolver');
const _ = require('lodash');
const joi = require('joi');


const intentSchema = joi.object().keys({
  action: joi.string().required(),
  queryText: joi.string().required(),
  fulfillmentText: joi.string().required(),
  parameters: joi.object(),
}).unknown(true);

// const mewsService = new MewsService();

class IntentResolver {
  constructor(intent) {
    if (intent) {
      this.setIntent(intent);
    }
  }

  setIntent(intent) {
    this.intent = joi.attempt(intent, intentSchema);
    return this;
  }

  async fulfillAsText() {
    const { intent } = this;
    if (!intent) throw new Error('Undefined intent');

    if (intent.action === 'input.unknown') {
      const texts = [
        'Sorry, I don\'t understand your intention.',
        'Here are some valid examples.',
        '',
      ];
      const exampleText = this.exampleSentences().map(s => `- ${s}`).join('\n');
      return texts.concat(exampleText).join('\n');
    } else if (intent.action === 'pms.summary_report.get') {
      const params = this.intent.parameters.fields;

      const dateInput = this.parseDateInput(params);
      const serviceName = params['service-name'].stringValue;

      const reportParams = {
        reportNames: params['report-name'].listValue.values.map(o => o[o.kind]),
        dateTimePeriod: dateInput ? DateTimeResolver.asDatePeriod(dateInput) : null,
        serviceName,
      };
      console.log('Report ​Input:', reportParams);

      const reports = await this.createReports(reportParams);
      console.log('Report Output:', reports);

      return reports.reduce((acc, string) => `${acc}\n${string}`, '');
    }
    return intent.fulfillmentText;
  }

  async createReports(params) {
    const self = this;
    let { reportNames } = params;
    const { serviceName, dateTimePeriod } = params;
    const pmsService = PmsServiceUtil.getService();

    if (!reportNames.length) {
      return ['Please define a report name.'];
    }

    if (reportNames.includes('summary report')) {
      reportNames = [
        'occupancy rate',
        'average daily rate',
        'revenue par',
      ];
    }

    if (dateTimePeriod) {
      // deliver exactly as parameters defined
      return self.generatePrettifiedReports({ reportNames, serviceName, dateTimePeriods: [dateTimePeriod] }, pmsService);
    }
    // deliver reports, assume every to-date
    return self.generatePrettifiedReports({
      reportNames,
      dateTimePeriods: [
        DateTimeResolver.asDatePeriod('today'),
        DateTimeResolver.asDatePeriod('month to date'),
        DateTimeResolver.asDatePeriod('year to date'),
      ],
    }, pmsService);
  }

  async generatePrettifiedReports(params, pmsService) {
    const self = this;
    let reportObjects = self.getReportObjects(params, pmsService);

    const calculationResults = await Promise
      .all(reportObjects.map(PmsReportUtil.executeReport));

    reportObjects = self.mapCalResultsToReportObjects(calculationResults, reportObjects);
    return reportObjects.map(PmsReportUtil.prettifyReportObject);
  }

  mapCalResultsToReportObjects(calculationResults, reportObjects) {
    for (let i = 0; i < calculationResults.length; i += 1) {
      const calResult = calculationResults[i];
      const reportObject = reportObjects[i];
      PmsReportUtil.assignResult(reportObject, calResult);
    }
    return reportObjects;
  }

  getReportObjects(params, pmsService) {
    const { reportNames, serviceName, dateTimePeriods } = params;

    const unFlattenReportObjects = reportNames.map((s) => {
      const reportObjectArr = dateTimePeriods.map(dtp => PmsReportUtil.getReportObject(s, {
        dateTimePeriod: dtp,
        serviceName,
      }, pmsService));
      return reportObjectArr;
    });

    return _.flatten(unFlattenReportObjects).filter(r => !!r);
  }

  parseDateInput(params) {
    let dateInput = params['to-date-period'].stringValue || params.date.stringValue;
    if (dateInput) return dateInput;

    dateInput = params['date-period'].structValue;
    if (!dateInput) return '';

    return {
      startDate: dateInput.fields.startDate && dateInput.fields.startDate.stringValue,
      endDate: dateInput.fields.endDate && dateInput.fields.endDate.stringValue,
    };
  }

  exampleSentences() {
    return [
      'How is today ocr?',
      'Please give me the revenue par report.',
      'Show me the month to date adr.',
      'Hey, I need ytd ocr and revpar.',
      'Update me with the yesterday spa service revenue.',
    ];
  }
}

module.exports = IntentResolver;
