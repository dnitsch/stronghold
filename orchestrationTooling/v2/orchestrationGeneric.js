'use strict';

const _ = require('lodash'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')],
    os = require('os'),
    when = require('when'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')();

/**
 * constructor init - empty .ctor
 * @param {*} path
 * @returns {function}
 */
function OrchestrationGeneric(baseObject) {
    this.obj = baseObject;
}

/**
 * runs any command supplied from
 * @method runOrchestration
 * @returns {callback}
 */
OrchestrationGeneric.prototype.runOrchestration = function (callback) {

    let errorHandler = null;
    const _obj = this.obj,
        logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
        logStream = `${_obj.params.stage}-orchestration-workspace`,
        logCorrelationId = `${_obj.body.envVars.TF_VAR_stage}-${((_obj.body.envVars.TF_VAR_stage == 'dev') ?  _obj.body.envVars.TF_VAR_revision_id : _obj.body.envVars.TF_VAR_name)}`;

    when(runOrcCommand(_obj))
    .then(callbackMotherShip)
    .catch((err) => {
        errorHandler = err;
        sharedUtils.loggerAbstracted('error', errorHandler,
            logGroup,
            logStream,
            logCorrelationId
        );
    })
    .done((result) => {
        sharedUtils.loggerAbstracted('debug', result,
            logGroup,
            logStream,
            logCorrelationId
        );
    });

    function runOrcCommand(input) {
        const _input = input;
        return when.promise((resolve, reject) => {
          const runFn = function (inputFn) {
            const __input = inputFn;
            const shellOptions = {
              cwd: __input.body.STRONGHOLD_orc_cwd || os.homedir(),
              detached: true,
              env: sharedUtils.envHandler(_obj.body.envVars),
              shell: true
            };

            __input.commandArray = _.isArray(__input.body.STRONGHOLD_orc_command) ? __input.body.STRONGHOLD_orc_command : __input.STRONGHOLD_orc_command.split(',');
            sharedUtils.shellAbstractionWLog(__input.body.STRONGHOLD_orc_exec, __input.commandArray, shellOptions, {
                  logGroup: logGroup,
                  logStream: logStream,
                  correlation_id: logCorrelationId
                }, (e, d) => {
                    if (e) {
                        __input.mothership = false;
                    } else {
                        __input.mothership = true;
                        return resolve(__input);
                    }
                });
            };

            return runFn(_input);
        });
    }

    function callbackMotherShip(input) {
        var _input = input;
        return  when.promise((resolve, reject) => {
            var mothershipFn = function (inputFn) {
                var __input = inputFn;
                if (__input.body.callback) {
                    sharedUtils.callbackExtendor(__input.body.callback_params, (__input.mothership ? 'proceed' : 'abort'), __input.header);
                    return resolve({OK: true})
                } else {
                    console.log('No callback requested. Is this a local operation?');
                    return resolve({OK: true})
                }
            };

            return mothershipFn(_input);
        })
    }

    /**
     * Always return
     * finish on callback to CI separately
     *
     */
    return callback(errorHandler, {OK: true});
    // TODO: wait for initialization of sessionId at least until handing off.

};


module.exports = OrchestrationGeneric;
