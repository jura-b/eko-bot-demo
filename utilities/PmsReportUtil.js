const _ = require('lodash');

class PmsReportUtil {
  static getReportObject(reportName, params, pmsService) {
    const { serviceName, dateTimePeriod } = params;
    const reportNameMapper = {
      // 'summary report': {
      //   name: 'summary report',
      //   prettyName: 'Summary Report',
      //   function: this.getSummaryReport,
      //   dateTimePeriod,
      // },
      'occupancy rate': {
        name: 'occupancy rate',
        prettyName: 'Occupancy Rate',
        functionName: 'getOccupancyRate',
        service: pmsService,
        dateTimePeriod,
      },
      'average daily rate': {
        name: 'average daily rate',
        prettyName: 'Average Daily Rate',
        functionName: 'getAverageDailyRate',
        service: pmsService,
        dateTimePeriod,
      },
      'revenue par': {
        name: 'revenue par',
        prettyName: 'Revenue Par',
        functionName: 'getRevenuePar',
        service: pmsService,
        dateTimePeriod,
      },
      'service revenue': {
        name: 'service revenue',
        prettyName() {
          return `${_.upperFirst(this.arguments.serviceName)} Service Revenue`;
        },
        functionName: 'getServiceRevenue',
        service: pmsService,
        dateTimePeriod,
        arguments: {
          serviceName,
        },
      },
    };

    return reportNameMapper[reportName];
  }

  static prettifyReportObject(reportObject) {
    const result = _.isNumber(reportObject.result)
      ? reportObject.result.toFixed(2) : reportObject.result;

    if (typeof reportObject.prettyName === 'function') {
      reportObject.prettyName = reportObject.prettyName();
    }
    return `${reportObject.dateTimePeriod.prettyString} ${reportObject.prettyName}: ${result}`;
  }

  static async executeReport(reportObject) {
    const {
      functionName, service, dateTimePeriod,
      arguments: args,
    } = reportObject;

    try {
      const result = await service[functionName](dateTimePeriod, args);
      return result;
    } catch (err) {
      return err.prettyMessage || err.message;
    }
  }

  static assignResult(reportObject, calculationResult) {
    reportObject.result = calculationResult;
  }
}

module.exports = PmsReportUtil;
