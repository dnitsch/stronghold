'use strict';

/*jslint todo: false */
const _ = require('lodash'),
    when = require('when'),
    ServiceHelper = require('stronghold-services-helper'),
    sharedUtils = require('../sharedUtility'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')];

/**
 * initialising the re-useable Jenkins constructor
 * @constructor
 * @param {Express.Request} obj - full request Object
 * @returns {void} initialized ctor
 */
function JenkinsWorker(obj) {
    this.obj = obj;
}

/**
 * @method internal
 * @param {*} callback
 */
function jenkinsCrumb(callback) {
    ServiceHelper.tcpSender.restAbstractBasicAuth(`${conf.buildTool.jenkins.base_url}/crumbIssuer/api/json`, {}, {}, {}, {}, "GET", conf.buildTool.jenkins.credentials, (e, d) => {
        if (e) {
            return callback(e);
        } else {
            return callback(null, {
                [`${d.crumbRequestField}`]: d.crumb
            });
        }
    });
}

/**
 * HELPER METHOD
 * IF ASYNC worker was invoked with a callback_url it will be passed into this method
 * @param {function} callback
 */
JenkinsWorker.prototype.notify = function (callback) {
    let errorHandler = null;

    const _obj = this.obj;
    /** this should be async method and returns success straight away
     * 1. get Jenkins Crumb and pass it to the worker along with the callback_url
     * 2. onSuccess trigger callback to build tool (Jenkins/GitLab/
     */
    const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/control-plane`,
        logStream = `jenkins`,
        log_correlation_id = _.replace(_obj.body.callback_url, /[\://\.]+/gi, '_');

    when(getCrumb(_obj))
        .then(notifyPipeline)
        .catch((err) => {
            errorHandler = err;
        })
        .done((result) => {
            sharedUtils.loggerAbstracted(_.isEmpty(errorHandler) ? 'debug' : 'error', JSON.stringify(_.isEmpty(errorHandler) ? result : errorHandler), logGroup, `${logStream}-callback`, log_correlation_id);
            return callback(errorHandler, result);
        });

    function getCrumb(prepObj) {
        const _prepObj = prepObj;
        return when.promise((resolve, reject) => {
            const getCrumbFn = function (outObj) {
                const _outOjb = outObj;
                return jenkinsCrumb((e, d) => {
                    if (e) {
                        return reject(e);
                    } else {
                        _outOjb.jenkinsCrumb = d;
                        return resolve(_outOjb);
                    }
                });
            };
            return getCrumbFn(_prepObj);
        });
    }

    function notifyPipeline(prepObj) {
        const _prepObj = prepObj;
        return when.promise((resolve, reject) => {
            const callbackPipelineFn = function (input) {
                const __input = input;
                __input.pipelineBody = {
                    json: JSON.stringify(__input.body), // parameters need to passed in here
                    [`${(__input.params.instruction ? __input.params.instruction : 'abort')}`]: (__input.params.instruction ? _.startCase(_.toLower(__input.params.instruction)) : 'Abort')
                };
                __input.pipelineHeader = _.assign(__input.jenkinsCrumb, {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cache-Control": "no-cache",
                    "Content-Length": JSON.stringify(__input.pipelineBody).length
                });

                // sharedUtils.loggerLocal('data', JSON.stringify(__input));
                ServiceHelper.tcpSender.restRequestFormDataWBasicAuth(
                    __input.body.callback_url, __input.pipelineBody, {}, {}, __input.pipelineHeader, "POST", conf.buildTool.credentials, (e, d) => {
                        if (e) {
                            return reject(_.isBuffer(e) ? e.toString() : e);
                        } else {
                            return resolve(__input);
                        }
                    });
            };
            return callbackPipelineFn(_prepObj);
        });
    }
};

module.exports = JenkinsWorker;
