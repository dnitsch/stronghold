'use strict';

/*jslint todo: true */
const _ = require('lodash'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')(),
    when = require('when'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')],
    util = require('util'),
    ServiceHelperAsync = util.promisify((require('stronghold-services-helper')).tcpSender.restAbstract),
    ServiceHelper = require('stronghold-services-helper');
// const ServiceHelper = require('../../libs/npm/Service-Helper');

/** initialising the re-useable Ansible constructor
 * @param {}
 */
function ConfigurationManager(entryObject) {
    this.obj = entryObject;
}

/**
 * run ansible playbook method
 * all required params are initialized in the constructor
 * additional values can be passed in as properties into the method
 * @param {function} callback - err, data
 * @returns {stuff}
 */
ConfigurationManager.prototype = {
    runConfigV2 (callback) {

        let errorHandler = null;

        const _obj = this.obj;

        const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
            logStream = `${_obj.params.stage}-configuration-playbook`,
            logCorrelationId = `${_obj.params.stage}-${_obj.params.commit_id}`;

        let completeErr = '',
            completeData = '';

        when(initializeTf(_obj))
            .then(cfgMgmtRun)
            .then(callBackMotherShip)
            .catch((err) => {
                errorHandler = err;
            })
            .done((result) => {
                if (errorHandler) {
                    sharedUtils.loggerAbstracted('error', JSON.stringify(errorHandler), logGroup, logStream, logCorrelationId);
                }
                return;
            })

        function initializeTf(input) {
            const _input = input;
            return when.promise((resolve, reject) => {
                const initTfFn = function (_input) {
                    const __input = _input;
                    // TODO: hanlde the body dynamically
                    if (__input.body.STRONGHOLD_tf_init) {
                        if (_.isUndefined(__input.body.envVars.ANSIBLE_TF_BIN) || _.isUndefined(__input.body.envVars.ANSIBLE_TF_DIR)) {
                            return reject(new Error("ANSIBLE_TF_BIN and ANSIBLE_TF_DIR must be BOTH defined in order to run Terraform init"));
                        }

                        const body = {
                            envVars: sharedUtils.envHandler(__input.body.envVars),
                            STRONGHOLD_orc_cwd: __input.body.envVars.ANSIBLE_TF_DIR,
                            STRONGHOLD_orc_exec: __input.body.envVars.ANSIBLE_TF_BIN
                        };

                        ServiceHelper.tcpSender.restAbstract(`${process.env.BASE_URL}orchestration/v1/init/${__input.params.stage}/${__input.params.app_name}/${__input.params.commit_id}/${__input.params.provider || 'aws'}`, body, {}, {}, __input.header, "PUT", (e, d) => {
                            if (e) {
                                reject(e);
                                return callback(e); // if init failed return to http socket and fail request
                            } else {
                                return resolve(__input);
                            }
                        });
                    } else {
                        return resolve(__input);
                    }
                };

                return initTfFn(_input);
            });
        }

        function cfgMgmtRun(_input) {
            const __input = _input;
            return when.promise((resolve, reject) => {
                const ansibleRunFn = function (__input) {
                    const ___input = __input;

                    ___input.shellOptions = {
                        cwd: ___input.body.STRONGHOLD_cfg_cwd,
                        detached: true,
                        env: sharedUtils.envHandler(___input.body.envVars),
                        shell: true
                    };

                    const logOptions = {
                        logGroup: logGroup,
                        logStream: logStream,
                        correlation_id: logCorrelationId
                    };

                    ___input.commandArray = _.isArray(___input.body.STRONGHOLD_cfg_command) ? ___input.body.STRONGHOLD_cfg_command : ___input.STRONGHOLD_cfg_command.split(',');
                    sharedUtils.shellAbstractionWLog(___input.body.STRONGHOLD_cfg_exec, ___input.commandArray, ___input.shellOptions, logOptions, (e, d, code) => {
                        if (!(_.isEmpty(e)) || code != 0) {
                            ___input.mothership = false;
                            return resolve(___input);
                        } else {
                            ___input.mothership = true;
                            return resolve(___input);
                        }
                    });
                    // sharedUtils.shellAbstractionWLog(___input.body.STRONGHOLD_cfg_exec, ___input.commandArray, ___input.shellOptions, logOptions)
                    //     .then((data) => {
                    //         ___input.mothership = true;
                    //         return resolve(___input);
                    //     }).catch((err) => {
                    //         ___input.mothership = false;
                    //         return resolve(___input);
                    //     });
                    return callback(completeErr, completeData);
                };

                return ansibleRunFn(__input);
            });
        }

        function callBackMotherShip(input) {
            const _input = input;
            return when.promise((resolve, reject) => {
                const callBackMotherShipFn = function (input) {
                    const __input = input;

                    if (__input.body.callback) {
                        sharedUtils.callbackExtendor(__input.body.callback_params, (__input.mothership ? 'proceed' : 'abort'), __input.header);
                        return resolve({
                            OK: true
                        });
                    } else {
                        console.log('No callback requested. Is this a local operation?');
                        return resolve({
                            OK: true
                        });
                    }
                };

                return callBackMotherShipFn(_input);
            });
        }
    }
}

module.exports = ConfigurationManager;
