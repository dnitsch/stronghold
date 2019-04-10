'use strict';

/**
 * @namespace buildTooling.v2.factoryBuildTooling
 */
const buildTooling = {
    gitCheckout (input, callback) {
        const _input = input;
        const buildWorker = new (require('./buildToolingWorkerGitCheckout'))(_input);
        return buildWorker.gitCheckoutV2((e, d) => {
            return callback(e, d);
        });
    },
    configure (input, callback) {
        const _input = input;
        const buildWorker = new (require('./buildToolingWorkerConfigure'))(_input);
        return buildWorker.pipelineConfigureV2((e, d) => {
            return callback(e, d);
        });
    },
    orchestrate (input, callback) {
        const _input = input;
        const buildWorker = new (require('./buildToolingWorkerProvisionCreate'))(_input);
        return buildWorker.pipelineOrchestrateV2((e, d) => {
            return callback(e, d);
        });
    },
    /**
     *
     * @param {*} input
     * @param {*} callback
     * @returns {CallableFunction}
     */
    destroy (input, callback) {
        const _input = input;
        const buildWorker = new (require('./buildToolingWorkerProvisionDestroy'))(_input);
        return buildWorker.pipelineWsDestroyV2((e, d) => {
            return callback(e, d);
        });
    },
    /**
     *
     * @method notify
     * @name notify
     * @param {*} input
     * @param {*} callback
     * @returns
     */
    notify (input, callback) {
        const _input = input;
        const ci_type = _input.body.callback_ci_type;
        const buildWorker = new (require('./buildToolingCiServerCallback'))(_input);
        return buildWorker.selector(ci_type, (e, d) => {
            return callback(e, d);
        });
    }
};

function factoryBuildTooling() {
    return Object.create(buildTooling);
}

module.exports = factoryBuildTooling
