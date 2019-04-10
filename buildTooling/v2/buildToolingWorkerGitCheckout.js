'use strict';
// jslint todo: false
// jshint expr: true
const when = require('when'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')],
    fse = require('fs-extra'),
    _ = require('lodash'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')();

/**
 * @constructor
 */
function BuildWorker(entryObject) {
    this.obj = entryObject;
    this.git = null;
}

/**
 *
 */
BuildWorker.prototype.gitCheckoutV2 = function (callback) {
    /** this should be async method and returns success straight away
     * 1. parse response ^
     * 2. get Jenkins Crumb and pass it to the worker ^
     * 3. DoWork ASYNC based on command received this should be idempotent! ==> the workers will need to perform the callback as they are also ASYNC
     **/
    let errorHandler = null;
    const _this = this,
        _obj = _this.obj;
    let retry_count = 0;

    const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/control-plane`,
        logStream = `git-checkout`,
        log_correlation_id = `build-${_obj.params.commit_id}`;


    when(createDir(_obj))
        .then(doGitPrep)
        .then(doGitCheckout)
        .catch((err) => {
            errorHandler = err;
        })
        .done((result) => {
            if (errorHandler) {
                sharedUtils.loggerAbstracted('error', JSON.stringify(errorHandler), logGroup, logStream, log_correlation_id);
                return callback({
                    OK: false,
                    Message: JSON.stringify(errorHandler)
                });
            } else {
                sharedUtils.loggerAbstracted('debug', JSON.stringify(result), logGroup, logStream, log_correlation_id);
                return callback(null, {
                    OK: true,
                    Message: "CheckedOutToSpecifiedLocation",
                    statusCode: (_obj.params.sync ? 200 : 202)
                });
            }
        });

    function createDir(inputDir) {
        const _input = inputDir;
        return when.promise((resolve, reject) => {
            const createDir = function (inputFnDir) {
                const __input = inputFnDir;
                __input.gitPath = `${__input.body.infra_base_path}/${__input.params.sha_id}`;
                fse.ensureDir(__input.gitPath, (err) => {
                    if (err) {
                        return reject(err);
                    } else {
                        _this.git = require('simple-git')(__input.gitPath);
                        return resolve(__input);
                    }
                });
            };
            return createDir(_input);
        });
    }

    function doGitPrep(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const compareRevisonToHEAD = function (inputSanityFn) {
                const _inputSanity = inputSanityFn;
                const _head = ((_inputSanity.body.head) ? _inputSanity.body.head : 'HEAD');
                _this.git.revparse([_head], (e, d) => {
                    if (e) {
                        _inputSanity.head = e;
                        return checkRepoFn(_inputSanity);
                    } else {
                        _inputSanity.head = d;
                        return checkRepoFn(_inputSanity);
                    }
                });
            };

            const checkRepoFn = function (inputFn) {
                const __input = inputFn;
                _this.git.checkIsRepo((e, d) => {
                    if (e) {
                        return reject(e);
                    } else {
                        if (!d) {
                            return doGitClone(__input);
                        } else if (__input.head.trim() === __input.params.sha_id.trim()) {
                            return resolve(__input);
                        } else {
                            return resolve(__input);
                        }
                    }
                });
            };

            const doGitClone = function (inputFn2) {
                const __input = inputFn2;
                // _this.git.clone(__input.body.git_url.replace(/https+/gm, "ssh"), '.', ['-n', '-o StrictHostKeyChecking=no'], (e, d) => {
                _this.git.clone(__input.body.git_url.replace(/https+/gm, "ssh"), '.', ['-n'], (e, d) => {
                    if (e) {
                        return reject(e);
                    } else {
                        return resolve(__input);
                    }
                });
            };
            return compareRevisonToHEAD(_input);
        });
    }

    function doGitCheckout(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const checkoutFn = function (inputFn) {
                const __input = inputFn;
                _this.git.checkout(__input.params.sha_id, (e, d) => {
                    if (e) {
                        if (__input.params.sync) {
                            return reject(e);
                        } else {
                            __input.instruction = 'abort';
                            return notifyPipelineFn(__input);
                        }
                    } else {
                        if ((_.isBoolean(__input.params.sync) && __input.params.sync) || __input.params.sync === 'true') {
                            return resolve(d);
                        } else {
                            __input.instruction = 'proceed';
                            return notifyPipelineFn(__input);
                        }
                    }
                });
            };

            const notifyPipelineFn = function (inputFnNotify) {
                const ___input = inputFnNotify;
                sharedUtils.callbackExtendorCb(___input.body, ___input.instruction, ___input.header, (e, d) => {
                    if (e) {
                        if (_.isUndefined(___input.body.callback_ci_type) || ___input.body.callback_ci_type == "jenkins") {
                            ___input.e = e;
                            return retrySlowBuildTool(___input);
                        } else {
                            return reject(e);
                        }
                    } else {
                        return resolve(d);
                    }
                });
            };

            const retrySlowBuildTool = function (input_retry) {
                const _input_retry = input_retry; // should be coming from a config file
                if (_input_retry.e.responseData.toString().match(/(HTTP ERROR 404|Not found)/)) {
                    if (retry_count === conf.buildTool.retry_count) {
                        return reject('Too many failed attempts contacting a slow java application that cannot register its own endpoints in time');
                    } else {
                        retry_count++;
                        setTimeout(notifyPipelineFn, conf.buildTool.retry_timeout, _input_retry);
                    }
                } else {
                    // this should never be called - SQ should flag as tech debt
                    return resolve('called Jenkins eventually');
                }
            };
            return checkoutFn(_input);
        });
    }
};

module.exports = BuildWorker;
