'use strict';

const _ = require('lodash'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')],
    when = require('when'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')();

/**
 * constructor init - empty .ctor
 * @param {*} path
 * @returns {function}
 */
function TerraWorkerWorkSpaceCreate(entryObject) {
    this.obj = entryObject;
}

/**
 * manages workspaces, initializes constructor class object
 * - creates a workspace if one doesn't exist
 * - selects workspaces
 * - runs apply
 * - exits
 *
 * todo: standardise commit_id / sha_id / revision_id
 * todo: extract sha_id from url and
 * @returns {callback}
 */
TerraWorkerWorkSpaceCreate.prototype.workspaceCreateV2 = function (callback) {

    let errorHandler = null;

    const _obj = this.obj,
        logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
        logStream = `${_obj.params.stage}-orchestration-workspace`,
        // logCorrelationId = `${_obj.params.stage}-${((_obj.params.stage == 'dev') ? _obj.body.envVars.TF_VAR_revision_id :  _obj.body.envVars.TF_VAR_name)}`;
        logCorrelationId = `${_obj.params.stage}-${_obj.params.commit_id}`;

    const logOptions = {
        logGroup: logGroup,
        logStream: logStream,
        correlation_id: logCorrelationId
    };

    when(selectWorkSpace(_obj))
        .then(callbackMotherShip)
        .catch((err) => {
            errorHandler = err;
            sharedUtils.loggerAbstracted('error', JSON.stringify(errorHandler),
                logGroup, logStream,
                logCorrelationId
            );
        })
        .done((result) => {
            sharedUtils.loggerAbstracted('debug', JSON.stringify(result),
                logGroup, logStream,
                logCorrelationId
            );
        });

    function selectWorkSpace(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const selectFn = function (inputFn) {
                const __input = inputFn;

                __input.shellOptions = {
                    cwd: __input.body.STRONGHOLD_orc_cwd,
                    detached: true,
                    env: sharedUtils.envHandler(__input.body.envVars),
                    shell: true
                };

                // TODO: Stronghold Validations. move this to model validations class
                if (_.isNull(__input.body.STRONGHOLD_tf_workspace) || _.isEmpty(__input.body.STRONGHOLD_tf_workspace)) {
                    return reject(new Error('Missing required property in body: STRONGHOLD_tf_workspace'));
                }

                const cmdArr = [
                        __input.body.STRONGHOLD_orc_exec, 'workspace', 'select', __input.body.STRONGHOLD_tf_workspace, '&&',
                        __input.body.STRONGHOLD_orc_exec, 'apply', '-auto-approve=true', `-parallelism=${process.env.STRONGHOLD_TERRAFORM_PARALLELISM || 10}`
                    ];

                // const cmdText = _.join(_.compact(cmdArr), ' ');
                const cmdText = _.join(cmdArr, ' ');

                // sharedUtils.shellAbstraction(cmdText, shellOptions, (e,d) => {
                sharedUtils.shellAbstractionWLog(cmdText, [], __input.shellOptions, logOptions, (e, d) => {
                    if (e) {
                        console.error(e);
                        if (e.indexOf('can create this workspace with the "new" subcommand') > -1) {
                            return createWsFn(__input);
                        } else {
                            __input.mothership = false;
                            //  return reject(e)
                            return resolve(__input); // resolves to calling back mothership with fail
                        }
                    } else {
                        console.info(d);
                        __input.mothership = true;
                        return resolve(__input);
                    }
                });
            };

            /**
             *
             * @param {*} inputnNewFn
             * @returns {*}
             */
            const createWsFn = function (inputnNewFn) {

                const _inputWs = inputnNewFn;

                const cmdArr = [
                        _inputWs.body.STRONGHOLD_orc_exec, 'workspace', 'new', _inputWs.body.STRONGHOLD_tf_workspace, '&&',
                        _inputWs.body.STRONGHOLD_orc_exec, 'workspace', 'select', _inputWs.body.STRONGHOLD_tf_workspace, '&&',
                        _inputWs.body.STRONGHOLD_orc_exec, 'apply', '-auto-approve=true', `-parallelism=${process.env.STRONGHOLD_TERRAFORM_PARALLELISM || 10}`
                ];

                const cmdText = _.join(cmdArr, ' ');

                sharedUtils.shellAbstractionWLog(cmdText, [], _inputWs.shellOptions, logOptions, (e, d) => {
                        if (e) {
                            _inputWs.mothership = false;
                            return resolve(_inputWs); // resolves to calling back mothership with fail
                        } else {
                            console.info(d);
                            _inputWs.mothership = true;
                            return resolve(_inputWs);
                        }
                    });
            };
            return selectFn(_input);
        })
    }

    function callbackMotherShip(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const mothershipFn = function (inputFn) {
                const __input = inputFn;
                if (__input.body.callback) {
                    sharedUtils.callbackExtendor(__input.body.callback_params, (__input.mothership ? 'proceed' : 'abort'), __input.header);
                    return resolve({
                        OK: true
                    })
                } else {
                    return resolve({
                        OK: true,
                        Message: 'No callback requested. Is this a local operation?'
                    })
                }
            };

            return mothershipFn(_input);
        })
    }
    /**
     * Always return
     * finish on callback to CI separately
     */

    return callback(errorHandler, {
        OK: true
    });

};


module.exports = TerraWorkerWorkSpaceCreate;
