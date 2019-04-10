'use strict';

const b = new (require('../../sharedWorkers/backgroundWorker'))()

const spawnHelper = {

    validBash () {
        b.spawnCallerBash(
        "echo",
        ["$TEST"],
        {
            cwd: "/bin",
            detached: true,
            shell: true,
            env: {
                TEST: "Hello World"
            },
        });
    },
    invalidBash () {
        b.spawnCallerBash(
        "foo",
        ["$TEST"],
        {
            cwd: "/bin",
            detached: true,
            shell: true,
            env: {
                TEST: "Hello World"
            },
        });
    }
}

module.exports = spawnHelper;
