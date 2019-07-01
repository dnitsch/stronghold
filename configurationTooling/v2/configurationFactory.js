'use strict';

const configure = {
    playbookConfigure (input, callback) {
        const _input = input,
            CfgMgr = new (require('./configurationWorker'))(_input);
        return CfgMgr.runConfigV2((e, d) => {
            return callback(e, d);
        })
            // .then(( data) => {
            //     return callback(null, data);
            // })
            // .catch((e) => {
            //     return callback(e)
            // })
    }
};

function factoryConfigure() {
    return Object.create(configure);
}

module.exports = factoryConfigure;
