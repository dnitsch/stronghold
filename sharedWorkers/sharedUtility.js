'use strict';

const os = require('os'),
    config = require('../config/config')[(process.env.NODE_ENV || 'dev')],
    custom_cw_logger = require('stronghold-logging-library-cw'),
    logger = require('./logger'),
    when = require('when'),
    // var logger = require('../../../../libs/npm/logger_lib'),
    _ = require('lodash'),
    util = require('util'),
    { restAbstract } = require('stronghold-services-helper').tcpSender,
    ServiceHelper = require('stronghold-services-helper'),
    ServiceHelperAsync = util.promisify(restAbstract),
    // var ServiceHelper = require('../../../../libs/npm/Service-Helper'),
    BackgroundWorker = require('./backgroundWorker');

let cw_sequence_token = null;
// const logger = base_logger.base();

// factory
const utils = {
    /**
     *
     * @param {String} command
     * @param {Object<os.} shellOptions
     * @param {*} callback
     */
    shellAbstractionWLog (command, args, shellOptions, logObject, callback) {
        const spawner = new BackgroundWorker();
        const _command = command, _args = args, _shellOptions = shellOptions, _logObject = logObject, _this = this;
        // const promise = return new Promise((resolve, reject) => {});
        let completeErr = '',
            bufferedLog = '',
            logCounter = 0;

        spawner.spawnCallerBash(_command, _args, _shellOptions, (err, data, code) => {
            if (err) {
                completeErr += err;
                _this.loggerAbstracted('error', err, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
            } else if (data) {
                bufferedLog += data;
                if (logCounter == (process.env.STRONGHOLD_LOG_EVENT_SIZE || 5)) {
                    _this.loggerAbstracted('info', bufferedLog, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
                    logCounter = 0;
                    bufferedLog = '';
                }
                logCounter++;
            } else {
                // DO NADA
            }
            if (_.isNumber(code)) {
                // if (callback) {
                    if (code == 0) {
                        _this.loggerAbstracted('info', bufferedLog, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
                        _this.loggerAbstracted('info', `[EXITCODE] ${code.toString()}${os.EOL}Command: ${_command} ${_args}`, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
                        return callback(null, {}, code);
                    } else {
                        _this.loggerAbstracted('error', completeErr + bufferedLog, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
                        _this.loggerAbstracted('error', `[EXITCODE] ${code.toString()}${os.EOL}Command: ${_command} ${_args}`, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
                        return callback(completeErr, data, code);
                    }
                // } else {
                //     return new Promise((resolve, reject) => {

                //     })
                // }
            }
        });
    },
    async shellAbstractionWLogAsync (command, args, shellOptions, logObject) {
        const spawner = new BackgroundWorker();
        const _command = command, _args = args, _shellOptions = shellOptions, _logObject = logObject, _this = this;
        // const promise = return new Promise((resolve, reject) => {});
        let completeErr = '',
            bufferedLog = '',
            logCounter = 0,
            outCode = 0;

        const stream = spawner.backgroundWorkerAsync(_command, _args, _shellOptions);

        for await (const out of stream) {
            if (out.err) {
                completeErr += out.err;
                _this.loggerAbstracted('error', completeErr, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
            } else if (out.data) {
                bufferedLog += out.data;
                if (logCounter == (process.env.STRONGHOLD_LOG_EVENT_SIZE || 5)) {
                    _this.loggerAbstracted('info', bufferedLog, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
                    logCounter = 0;
                    bufferedLog = '';
                }
                logCounter++;
            } else if (out.code) {
                outCode = out.code;
            } else {
            }
        }
        if (outCode == 0) {
            _this.loggerAbstracted('info', bufferedLog, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
        }

        _this.loggerAbstracted(outCode === 0 ? 'info': 'error', `[EXITCODE] ${outCode.toString()}${os.EOL}Command: ${_command} ${_args}`, _logObject.logGroup, _logObject.logStream, _logObject.correlation_id);
        return when.resolve({e: completeErr, code: outCode});
    },
    /**
     * @param {*} body
     * @param {String} instruction
     */
    callbackExtendor (body, instruction, header) {
        const _body = body, _instruction = instruction, _header = header || {};
        restAbstract(`${process.env.BASE_URL}build/v2/pipeline/notify/${_instruction}`, _body, {}, {}, _header, "PUT", (e,d) => {
            return;
        });
    },
    /**
     *
     * @param {} body
     * @param {*} instruction
     * @param {*} header
     */
    async callbackExtendorAsync (body, instruction, header, logObject) {
        const _body = body, _instruction = instruction, _header = header || {};
        try {
            const cb_called = await ServiceHelperAsync(`${process.env.BASE_URL}build/v2/pipeline/notify/${_instruction}`, _body, {}, {}, _header, "PUT");
            return cb_called;
        } catch (ex) {
            utils.loggerAbstracted(logObject.logGroup, logObject.logStream, logObject.correlation_id);
            return {};
        }
    },
    /**
     * @param {*} body
     * @param {String} instruction
     * @returns {callback} callback
     */
    callbackExtendorCb (body, instruction, header, callback) {
        const _body = body, _instruction = instruction, _header = header || {};
        ServiceHelper.tcpSender.restAbstract(`${process.env.BASE_URL}build/v2/pipeline/notify/${_instruction}`, _body, {}, {}, _header, "PUT", (e,d) => {
            if (e) {
                return callback(e);
            } else {
                return callback(null, d);
            }
        });
    },
    /**
     * @method
     *
     * @param {String} type event type
     * @param {*} payload body of event
     * @param {String}  logGroup
     * @param {String} logStream
     * @param {String} correlation_id
     * @returns {void}
     */
    loggerAbstracted (type, payload, logGroup, logStream, correlation_id) {
        // const winston_logger = logger.winstonLogger();
        const _logGroup = logGroup,
            _logStream = logStream,
            _type = type,
            _payload = payload,
            _correlation_id = correlation_id;

        // logger.console_log({level: _type, message: _payload});
        logger.console_log(_type, _payload, _correlation_id);
        if (_.toLower(process.env.STREAM_REMOTE_LOGGER) === 'true') {
            // logger.remote_log(_type, _payload, _correlation_id, _logGroup, _logStream);
            custom_cw_logger.logWriteCwPromise({
                log_group: _logGroup,
                log_stream: _logStream,
                body: [_.assign({[_type]: _payload}, { correlation_id: _correlation_id}, {hostname: process.env.HOSTNAME})]
            }).then((data) => {
                cw_sequence_token = data.nextSequenceToken;
            }). catch((err) => {
                console.error('Error Logging Error');
            })
        }
    },
    /**
     * creates a custom environment variable definition for spawned shell executions
     * @method
     * @param {object} envVars
     * @returns
     */
    envHandler (envVars) {
        let _envVars = envVars,
            _currentEnv = process.env;
        // TODO: refactor this for a wider use case not just AWS.
        if (_envVars.STRONGHOLD_INHERIT_AWS_PROFILE) { // nothing to do here shell will inherit AWS_PROFILE from stronghold
            return _.assign(_currentEnv, _envVars);
        } else {
            if (_.isEmpty(_envVars.STRONGHOLD_CUSTOM_AWS_PROFILE)) {
                //assumes user has default credentials or other ways of authenticating inside the execution space
                _currentEnv = _.omit(_currentEnv, ['AWS_PROFILE']);
                return _.assign(_currentEnv, _envVars);
            } else {
                _currentEnv.AWS_PROFILE = _envVars.STRONGHOLD_CUSTOM_AWS_PROFILE;
                return _.assign(_currentEnv, _envVars);
            }
        }
    }
};

function sharedUtility () {
    return Object.create(utils);
}

module.exports = sharedUtility
