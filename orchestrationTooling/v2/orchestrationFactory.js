'use strict';

const orchestrate = {
    workspaceCreate (input, callback) {
        const _input = input;
        const terraWorkerWs = new (require('./orchestrationWorkspaceCreate'))(_input);
        return terraWorkerWs.workspaceCreateV2((e, d) => {
            return callback(e, d);
        });
    },
    workspaceDelete (input, callback) {
        const _input = input;
        const terraWorkerWs = new (require('./orchestrationWorkspaceDelete'))(_input);
        return terraWorkerWs.workspaceDeleteV2((e, d) => {
            return callback(e, d);
        });
    },
    genericOrchestrate (input, callback) {
        const _input = input;
        const orcWorker = new (require('./orchestrationGeneric'))(_input);
        return orcWorker.runOrchestration((e, d) => {
            return callback(e, d);
        });
    }
};

function factoryOrchestrate() {
    return Object.create(orchestrate);
}

module.exports = factoryOrchestrate;
