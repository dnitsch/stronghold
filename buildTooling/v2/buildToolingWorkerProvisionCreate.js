'use strict';
/*jslint todo: false */
const _ = require('lodash'),
    when = require('when'),
    ServiceHelper = require('stronghold-services-helper'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')(),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')];


/** initialising the re-useable Build constructor
 * @param {}
 */
function BuildWorker(entryObject) {
    this.obj = entryObject;
}

/**
 * @method pipelineOrchestrateV2
 * @returns
 * this should be async method and returns success only after initiliase Tf has worked
 * 1. parse response ^
 * 2. get Jenkins Crumb and pass it to the worker along with the callback_url ^
 * 3. DoWork ASYNC based on command received this should be idempotent! ==> the workers will need to perform the callback as they are also ASYNC
 * 4. onSuccess trigger callback to build tool (Jenkins/GitLab/
 */
BuildWorker.prototype.pipelineOrchestrateV2 = function (callback) {

    let errorHandler = null;
    const _obj = this.obj;

    const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
        logStream = `${_obj.params.stage}-orchestrate-pipeline-create`,
        log_correlation_id = `${_obj.params.stage}-${_obj.params.commit_id}`;

    when(cleanInput(_obj))
        .then(runInit)
        .then(runWs)
        .catch((err) => {
            errorHandler = err;
        })
        .done((result) => {
            if (errorHandler) {
                sharedUtils.loggerAbstracted('error', errorHandler, logGroup, logStream, log_correlation_id);
            } else {
                sharedUtils.loggerAbstracted('debug', result, logGroup, logStream, log_correlation_id);
            }
            return;
        });


    // make this shared function
    function cleanInput(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const tfInitFn = function (input) {
                const __input = input;
                __input.requestBody = _.assign({
                    callback: true
                }, {
                    callback_params: _.pick(__input.body, _.keys(conf.buildTool[__input.body.callback_ci_type || 'jenkins'].callback_model))
                }, __input.body);
                return resolve(__input);
            };
            return tfInitFn(_input);
        });
    }

    function runInit(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const tfInitFn = function (_input) {
                const __input = _input;
                ServiceHelper.tcpSender.restAbstract(`${process.env.BASE_URL}orchestration/v1/init/${__input.params.stage}/${__input.params.app_name}/${__input.params.commit_id}/${__input.params.provider || 'aws'}`, __input.requestBody, {}, {}, __input.header, "PUT", (e, d) => {
                    if (e) {
                        reject(e);
                        return callback(e);
                    } else {
                        return resolve(__input);
                    }
                });
            };
            return tfInitFn(_input);
        });
    }
    /**
     * workspace does workspace work if specified
     * @param {*} input
     */
    function runWs(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const tfWsFn = function (input) {
                const __input = input;
                ServiceHelper.tcpSender.restAbstract(`${process.env.BASE_URL}orchestration/v2/workspace/${__input.params.stage}/${__input.params.app_name}/${__input.params.commit_id}/${__input.params.provider || 'aws'}`, __input.requestBody, {}, {}, __input.header, "POST", (e, d) => {
                    if (e) {
                        return reject(e);
                    } else {
                        return resolve(__input);
                    }
                });
                return callback(errorHandler, {
                    OK: true
                });
            };
            return tfWsFn(_input);
        });
    }

};
module.exports = BuildWorker;
