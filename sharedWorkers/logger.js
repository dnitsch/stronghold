'use strict';
const winston = require('winston'),
    winston_cw = require('winston-aws-cloudwatch'),
    conf = require('../config/config')[process.env.NODE_ENV || 'dev'];

// define the custom settings for each transport (file, console)
const options = {
  console: {
    handleExceptions: true,
    json: false,
    colorize: true
  }
};
const consoleFormat = winston.format.printf(({ level, message, timestamp, correlation_id }) => {
    return `${timestamp} ${level}: ${message} ${correlation_id}`;
});

/**
 * setting maxListeners
 * TODO: this might not be the best solution but should be safe across most systems
 */
process.setMaxListeners(30);

// instantiate a new Winston Logger with the settings defined above
const logger =  winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    // format: winston.format.json(),
    format: winston.format.combine(
        winston.format.label({correlation_id: 'stage-undefined'}),
        winston.format.timestamp(),
        consoleFormat
    ),
    transports: [
        new winston.transports.Console(options.console),
    ],
    defaultMeta: {service: process.env.FNC_NAME || 'stronghold'},
    exitOnError: false
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

logger.console_log = (type, message, label) => {
    logger.log({level: type, message: message, correlation_id: label})
}

// todo: more work needs to go into this
logger.remote_log = (type, message, label, logGroup, logStream) => {
    const _logGroup = logGroup, _logStream = logStream + label.split('-')[1];
    const console_logger = logger.transports.find(transport => {
        return transport.name === 'console'
    });
    // const cw_logger = logger.transports.find(transport => {
    //     return transport.name === 'cloudwatch'
    // });
    const remote = new winston_cw({
        logGroupName: _logGroup,
        logStreamName: _logStream,
        createLogGroup: false,
        createLogStream: true,
        maxSequenceTokenAge: 999999
    })
    logger.configure({
        transports: [
            console_logger,
            remote
        ]
        });
    logger.log({level: type, message: message, correlation_id: label})
}

module.exports = logger;
