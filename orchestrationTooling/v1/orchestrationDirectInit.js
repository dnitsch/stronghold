'use strict';

const _ = require('lodash'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')(),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')];

/**
 * constructor init - empty .ctor
 * @param {*} path
 */
function TerraWorkerDirect(entryObject) {
    this.obj = entryObject;
}

/**
 *
 * @param {*} callback
 */
TerraWorkerDirect.prototype = {
    async initialize (callback) {
        try {
            const _obj = this.obj;

            const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${_obj.params.provider || 'aws'}/${_obj.params.app_name}`,
                logStream = `${_obj.params.stage}-orchestration-init`,
                logCorrelationId = `${_obj.params.stage}-${_obj.params.commit_id}`;

            const logOptions = {
                logGroup: logGroup,
                logStream: logStream,
                correlation_id: logCorrelationId
            };

            const shellOptions = {
                cwd: _obj.body.STRONGHOLD_orc_cwd || _obj.body.cwd,
                detached: true,
                env: sharedUtils.envHandler(_obj.body.envVars),
                shell: true
            };

            const command = _obj.body.STRONGHOLD_orc_command || [`init`],
                execCommand = _obj.body.STRONGHOLD_orc_exec || _obj.body.execCommand; // TODO: delete default once, v2 released completely.


            const init = await sharedUtils.shellAbstractionWLogAsync(execCommand, command, shellOptions, logOptions);
            if (!(_.isEmpty(init.e)) || init.code != 0) {
                return callback(init.e);
            }
            return callback(null, {OK: true});
        } catch (ex) {
            return callback(ex)
        }
    }
}

module.exports = TerraWorkerDirect;
