'use strict';

/*jslint todo: false */
const _ = require('lodash'),
    when = require('when'),
    ServiceHelper = require('stronghold-services-helper'),
// const ServiceHelper = require('../../../../../libs/npm/Service-Helper'),
    sharedUtils = require('../sharedUtility')(),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')];

/**
 * initialising the re-useable Gitlab constructor
 * @constructor
 * @param {Express.Request} obj - full request Object
 * @returns {void} initialized ctor
 */
function GitlabWorker(obj) {
    this.obj = obj;
}

/**
 * HELPER METHOD
 * IF ASYNC worker was invoked with a callback_url it will be passed into this method
 * @param {function} callback
 */
GitlabWorker.prototype.notify = function (callback) {
    let errorHandler = null;
    const _obj = this.obj;
    /** this should be async method and returns success straight away
     * 1. Get the Job ID of the next job
     * 2. play next job
     * 2.1 play or cancel
     */
    // LOG OPTIONS
    const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/control-plane`,
        logStream = "gitlab",
        log_correlation_id = _.replace(_obj.body.callback_url, /[\://\.]+/gi, '_'); //regex is not a good operation to do at this frequency

    when(getJobId(_obj))
        .then(nextJob)
        .catch((err) => {
            errorHandler = err;
        })
        .done((result) => {
            sharedUtils.loggerAbstracted(_.isEmpty(errorHandler) ? 'debug' : 'error', JSON.stringify(_.isEmpty(errorHandler) ? JSON.stringify(result) : JSON.stringify(errorHandler)), logGroup, `${logStream}-callback`, log_correlation_id);
            return callback(errorHandler, result);
        });

    function getJobId(prepObj) {
        const _prepObj = prepObj;
        return when.promise((resolve, reject) => {
            const getJobIdFn = function (input) {
                const __input = input;
                __input.pipelineHeader = _.assign( {"Cache-Control": "no-cache"}, conf.buildTool.gitlab.header);
                ServiceHelper.tcpSender.restAbstract(
                    `${conf.buildTool.gitlab.base_url}/${__input.body.callback_project_id}/pipelines/${__input.body.callback_pipeline_id}/jobs?page=1&per_page=200`, {}, {}, {}, __input.pipelineHeader, "GET", (e, d) => {
                        if (e) {
                            return reject(_.isBuffer(e) ? e.toString() : e);
                        } else {
                            __input.pipelineNextJob = _.find(d, {name: __input.body.callback_next })
                            return resolve(__input);
                        }
                    });
            };
            return getJobIdFn(_prepObj);
        });
    }

    //
    function nextJob(jobInput) {
        const _input = jobInput;
        return when.promise((resolve, reject) => {
            const callbackDecisionFn = function (input) {
                const __input = input;
                if (_.toLower(__input.params.instruction) == 'proceed') {
                    return callbackSucceedFn(__input);
                } else {
                    return callbackFailFn(__input);
                }
            };

            const callbackSucceedFn = function (input) {
                const __input = input;
                ServiceHelper.tcpSender.restAbstract(
                    `${conf.buildTool.gitlab.base_url}/${__input.body.callback_project_id}/jobs/${__input.pipelineNextJob.id}/play`, {}, {}, {}, __input.pipelineHeader, "POST", (e, d) => {
                        if (e) {
                            if (e.message.match(/(400|Unplayable Job)/)) {
                                return callbackRetrySuccessFn(__input);
                            } else {
                                return reject(_.isBuffer(e) ? e.toString() : e);
                            }
                        } else {
                            __input.result = d;
                            return resolve(__input);
                        }
                    });
                };
                const callbackRetrySuccessFn = function (input) {
                    const __input = input;
                    ServiceHelper.tcpSender.restAbstract(
                        `${conf.buildTool.gitlab.base_url}/${__input.body.callback_project_id}/jobs/${__input.pipelineNextJob.id}/retry`, {}, {}, {}, __input.pipelineHeader, "POST", (e, d) => {
                            if (e) {
                                return reject(_.isBuffer(e) ? e.toString() : e);
                            } else {
                                __input.result = d;
                                return resolve(__input);
                            }
                        });
                };
                const callbackFailFn = function (input) {
                const __input = input;
                ServiceHelper.tcpSender.restAbstract(
                    `${conf.buildTool.gitlab.base_url}/${__input.body.callback_project_id}/jobs/${__input.pipelineNextJob.id}/cancel`, {}, {}, {}, __input.pipelineHeader, "POST", (e, d) => {
                        if (e) {
                            return reject(_.isBuffer(e) ? e.toString() : e);
                        } else {
                            __input.result = d;
                            return resolve(__input);
                        }
                    });
            };
            return callbackDecisionFn(_input);
        });
    }
};

// vav
// GitlabWorker.prototype.getResult

module.exports = GitlabWorker;

//PRIVATE-TOKEN: 1cECRstjyDyuEdr27Xmb
//
// BASE_URL: https://gitlab.bootstrap.atoshcp.net/api/v4/projects/idam%2Fidam
//
// Pipeline_ID, JOB_ID
//
// GET_JOBS
// jobs?scope[]=pending&scope[]=running
//
// filter by manual and pending
// /projects/: id / pipelines /: pipeline_id / jobs
// /projects/idam%2Fidam/pipelines/1931/jobs
//
// START A JOB
// POST / projects /: id / jobs /: job_id / play
//
// CANCEL A JOB ON CALLBACK
// POST /projects/:id/jobs/:job_id/cancel
// STOP an environment and
// /projects/: id / pipelines /: pipeline_id / cancel
//
// RETRY A JOB
// POST /projects/:id/jobs/:job_id/retry
//
// Header Description
// X-Total The total number of items
// X-Total - Pages The total number of pages
// X-Per - Page The number of items per page
// X-Page The index of the current page(starting at 1)
// X-Next - Page The index of the next page
// X-Prev - Page The index of the previous page
