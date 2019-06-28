'use strict';

const orchestrate = {
    init (input, callback) {
        const _input = input;
        const terraWorkerWs = new (require('./orchestrationDirectInit'))(_input);
        // return terraWorkerWs.wsCreate((e, d) => {
        return terraWorkerWs.initialize((e, d) => {
            return callback(e, d);
        });
    }
};

function factoryOrchestrate() {
    return Object.create(orchestrate);
}

module.exports = factoryOrchestrate;
