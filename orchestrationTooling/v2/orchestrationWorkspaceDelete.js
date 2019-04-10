'use strict';

const _ = require('lodash'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')],
    when = require('when'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')();

/**
 * constructor init - empty .ctor
 * @param {*} path
 */
function TerraWorkerWorkSpaceDelete(entryObject) {
    this.obj = entryObject;
}

/**
 * Specific method for deleting workspace under TF
 * deletes workspaces, inherits init class object input
 * - selects workspaces
 * - runs destroy
 * - exits
 * - switches out to default
 * - deletes workspace
 * @method workspaceDeleteV2
 * @param {*} callback
 */
TerraWorkerWorkSpaceDelete.prototype.workspaceDeleteV2 = function (callback) {

    let errorHandler = null;
    const _obj = this.obj;

    // TODO: address logging requirements of third party users.
    const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
        logStream = `${_obj.params.stage}-orchestration-workspace-destroy`,
        // logCorrelationId = `${_obj.body.envVars.TF_VAR_stage}-${((_obj.body.envVars.TF_VAR_stage == 'dev') ?  _obj.body.envVars.TF_VAR_revision_id :  _obj.body.envVars.TF_VAR_name)}`;
        // logCorrelationId = `${_obj.params.stage}-${((_obj.params.stage == 'dev') ? _obj.body.envVars.TF_VAR_revision_id :  _obj.body.envVars.TF_VAR_name)}`;
        logCorrelationId = `${_obj.params.stage}-${_obj.params.commit_id}`;

    const logOptions = {
        logGroup: logGroup,
        logStream: logStream,
        correlation_id: logCorrelationId
    };

    when(selectAndDestroyWorkSpace(_obj))
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
        })

    function selectAndDestroyWorkSpace(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
            const selectDestructionFn = function (inputFn) {
                const __input = inputFn,
                    execCommand = __input.body.STRONGHOLD_orc_exec;

                const shellOptions = {
                    cwd: __input.body.STRONGHOLD_orc_cwd,
                    detached: true,
                    env: sharedUtils.envHandler(__input.body.envVars),
                    shell: true
                };

                const cmdArr = [
                    execCommand, 'workspace', 'select', __input.body.STRONGHOLD_tf_workspace, '&&',
                    execCommand, 'destroy', __input.body.STRONGHOLD_tf_args ? __input.body.STRONGHOLD_tf_args.join(' ') : null, '-force', '-lock=true', '-lock-timeout=0s', '-input=false', `-parallelism=${process.env.STRONGHOLD_TERRAFORM_PARALLELISM || 10}`, '-refresh=true', '&&',
                    execCommand, 'workspace', 'select', 'default', '&&',
                    execCommand, 'workspace', 'delete', __input.body.STRONGHOLD_tf_workspace
                ];

                const cmdText = _.join(_.compact(cmdArr), ' ');

                sharedUtils.shellAbstractionWLog(cmdText, [], shellOptions, logOptions, (e, d) => {
                    if (e) {
                        console.error(e);
                        __input.mothership = false;
                        return reject(e)
                    } else {
                        console.info(d);
                        __input.mothership = true;
                        return resolve(__input);
                    }
                })
            };
            return selectDestructionFn(_input);
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
                    console.log('No callback requested. Is this a local execution?');
                    return resolve({
                        OK: true
                    });
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

module.exports = exports = TerraWorkerWorkSpaceDelete;
