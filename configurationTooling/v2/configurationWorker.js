'use strict';

/*jslint todo: true */
const _ = require('lodash'),
    sharedUtils = require('../../sharedWorkers/sharedUtility')(),
    when = require('when'),
    conf = require('../../config/config')[(process.env.NODE_ENV || 'dev')],
    util = require('util'),
    ServiceHelper = require('stronghold-services-helper'),
    ServiceHelperAsync = util.promisify(ServiceHelper.tcpSender.restAbstract);

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
    /**
     *
     * @param {*} callback
     * @returns {void}
     */
    async runConfigV2 (callback) {
        const __input = this.obj;
        // move this to log object builder
        const logGroup = conf.logConfig[process.env.LOGGER_TYPE || 'cloudwatch'].logGroup + `/${__input.params.provider || 'aws'}/${__input.params.app_name}`,
            logStream = `${__input.params.stage}-configuration-playbook`,
            logCorrelationId = `${__input.params.stage}-${__input.params.commit_id}`;
        const logOptions = {
            logGroup: logGroup,
            logStream: logStream,
            correlation_id: logCorrelationId
        };

        /**
         * @private
         * conditional initialise
         */
        const init = async function() {

            if (_.isUndefined(__input.body.envVars.ANSIBLE_TF_BIN) || _.isUndefined(__input.body.envVars.ANSIBLE_TF_DIR)) {
                throw new Error("ANSIBLE_TF_BIN and ANSIBLE_TF_DIR must be BOTH defined in order to run Terraform init");
            }
            // move to builder function
            const body = {
                envVars: sharedUtils.envHandler(__input.body.envVars),
                STRONGHOLD_orc_cwd: __input.body.envVars.ANSIBLE_TF_DIR,
                STRONGHOLD_orc_exec: __input.body.envVars.ANSIBLE_TF_BIN
            };
            try {
                const is_initialised = await ServiceHelperAsync(`${process.env.BASE_URL}orchestration/v1/init/${__input.params.stage}/${__input.params.app_name}/${__input.params.commit_id}/${__input.params.provider || 'aws'}`, body, {}, {}, __input.header, "PUT")
                __input.is_initialised = is_initialised;

                return __input;

            } catch (ex) {
                return when.reject(ex);
            }
        }
        /**
         * @private
         * runs configure run
         */
        const do_cfg = async function() {
            __input.shellOptions = {
                cwd: __input.body.STRONGHOLD_cfg_cwd,
                detached: true,
                env: sharedUtils.envHandler(__input.body.envVars),
                shell: true
            };
            try {
                __input.commandArray = _.isArray(__input.body.STRONGHOLD_cfg_command) ? __input.body.STRONGHOLD_cfg_command : __input.STRONGHOLD_cfg_command.split(',');
                const cfg_out = await sharedUtils.shellAbstractionWLogAsync(__input.body.STRONGHOLD_cfg_exec, __input.commandArray, __input.shellOptions, logOptions);
                // __input.mothership = (!(_.isEmpty(cfg_out.e)) || cfg_out.code != 0) ? false : true;
                __input.mothership = cfg_out.code === 0 ? true : false;

                return __input;
            } catch (ex) {
                return when.reject(ex);
            }
        }

        try {
            if (__input.body.STRONGHOLD_tf_init) {
                // return await init();
                __input.init_done = await init().catch((err) => {
                    __input.init_err = err;
                });
            }
            // const initialised = await initializeTf(_obj);
            // return if successfully initialised;
            // FIX: currently, can't think of another way to return out of the function but continue processing in the background without
            //  handing over to another worker thread within this routine.
            if (__input.init_err) {
                return callback(__input.init_err);
            } else {
                callback(null, {});
            }

            const configured = await do_cfg();

            if (__input.body.callback) {
                const cb_called = await sharedUtils.callbackExtendorAsync(__input.body.callback_params, (configured.mothership ? 'proceed' : 'abort'), __input.header, logOptions);
                __input.cb_called = cb_called;
            } else {
                console.log('No callback requested. Is this a local operation?');
            }
            // cb_called
            return;
        } catch (ex) {
            sharedUtils.loggerAbstracted('error', JSON.stringify(`${ex.message} ${ex.stack}`), logGroup, logStream, logCorrelationId);
            return when.reject(ex);
        }
    }
}

module.exports = ConfigurationManager;
