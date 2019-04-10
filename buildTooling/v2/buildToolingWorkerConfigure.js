'use strict';
/*jslint todo: false */
const _ = require('lodash'), when = require('when');
const ServiceHelper = require('stronghold-services-helper'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')];
let sharedUtils = require('../../sharedWorkers/sharedUtility')();

/**
 * initialising the re-useable Build constructor
 * @constructor
 * @param {Express.Request} obj - full request Object
 * @returns {void} initialized ctor
 */
function BuildWorker(obj) {
    this.obj = obj;
}

/**
 * pipeline configure func
 * @method
 * @param {function} callback
 */
BuildWorker.prototype.pipelineConfigureV2 = function (callback) {
/** this should be async method and returns success straight away
 * 1. parse response ^
 * 2. get Jenkins Crumb and pass it to the worker along with the callback_url ^
 * 3. DoWork ASYNC based on command received this should be idempotent! ==> the workers will need to perform the callback as they are also ASYNC
 * 4. onSuccess trigger callback to build tool (Jenkins/GitLab/
 */
    let errorHandler = null;
    const _obj = this.obj;

    const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
        logStream = `${_obj.params.stage}-pipeline-configure`,
        log_correlation_id = `${_obj.params.stage}-${_obj.params.commit_id}`;

    when(prepPipelineWorker(_obj))
        .then(doPipelineWork)
        .catch((err) => {
            errorHandler = err;
            sharedUtils.loggerAbstracted('error', errorHandler.message, logGroup, logStream, log_correlation_id);
        })
        .done((result) => {
            sharedUtils.loggerAbstracted('debug', result, logGroup, logStream, log_correlation_id);
            return callback(errorHandler, result);
        });

    function prepPipelineWorker(prepObj) {
        const _prepObj = prepObj;
        return when.promise((resolve, reject) => {
            const cleanFn = function (input) {
                const _input = input;

                _input.body = _.assignIn(
                    {
                        callback: true
                    },
                    {
                        callback_params: _.pick(_input.body, _.keys(conf.buildTool[_input.body.callback_ci_type || 'jenkins'].callback_model))
                    },
                    _input.body
                );
                return resolve(_input);
            };
            return cleanFn(_prepObj);
        });
    }

    function doPipelineWork(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const ansibleRunFn = function (input) {
                const __input = input;
                ServiceHelper.tcpSender.restAbstract(`${process.env.BASE_URL}configuration/v2/playbook/${__input.params.stage}/${__input.params.app_name}/${__input.params.commit_id}/${__input.params.provider || 'aws'}`, __input.body, {}, {}, __input.header, "PUT", (e, d) => {
                    if (e) {
                        return reject(e);
                    } else {
                        return resolve(__input);
                    }
                });
            };
            return ansibleRunFn(_input);
        });
    }
};

module.exports = BuildWorker;
