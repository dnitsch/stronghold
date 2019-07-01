'use strict';

const _ = require('lodash'),
    when = require('when'),
    shells = ["powershell.exe", "cmd.exe", "/bin/sh", "/bin/bash", "/bin/zsh"],
    Conf = require('../config/config')[(process.env.NODE_ENV || 'dev')];

/** initialising the re-useable spawn process in the constructor
 * using spawn, because it's better suited for long pipe-able operations as opposed to exec
 * - https://dzone.com/articles/understanding-execfile-spawn-exec-and-fork-in-node
 * - nodejs docs: https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
 */
function backgroundWorker() {
    this.spawner = require('child_process').spawn;
}

/**
 * spawns a bash shell process with the following arguments and passes back the messages from the std.io
 * notes around this can be found [here](https://nodejs.org/api/child_process.html#child_process_options_detached)
 * should also explain default behaviours set
 *
 * detached: true sets the child process separate from the parent, useful in cases where long running process if
 * interupted by parent uncaughtExcpetion error will finish runnning - e.g. avoids locking of TF state file
 *
 * spawn.unref() - ensures parent doesn't wait for child process to  run
 * @param {string} command
 * @param {String[]} args
 * @param {Object} options shellOptions to pass into spawned process [details](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
 * @returns {}
 */
backgroundWorker.prototype = {
       spawnCallerBash (command, args, options, callback) { // TODO: make this more generic
            const _this = this;
            const _command = command,
                _args = args,
                _options = options;

            let errMe = '';

            if (_.isUndefined(_this.unref)) {
                // setting default behaviour
                _this.unref = true;
            } else {
                _this.unref = _this.unref;
            }

            const spawn = _this.spawner(
                _command,
                _args,
                _options
            );

            // unrefs by default else runs in foreground and coupled to parent process
            if (_.isUndefined(_this.unref) || _.isNull(_this.unref) || _.isEmpty(_this.unref)) {
                spawn.unref();
            }

            spawn.stdout.on('data', (data) => {
                return callback(null, data.toString(), null);
            });

            spawn.stderr.on('data', (err) => {
                errMe += err.toString();
                return callback(err.toString(), null, null);
            });

            spawn.on('uncaughtException', (err) => {
                errMe += err.toString();
                return callback(errMe, null, null);
            });

            spawn.on('error', (err) => {
                errMe += err.toString();
                return callback(errMe, null, null);
            });

            spawn.on('close', (code) => {
                return callback(errMe, null, code);
            });
        },
        async *backgroundWorkerAsync (command, args, options) {
            const _this = this;
            const _command = command,
                _args = args,
                _options = options;

            let errMe = '';

            if (_.isUndefined(_this.unref)) {
                // setting default behaviour
                _this.unref = true;
            } else {
                _this.unref = _this.unref;
            }

            const spawn = _this.spawner(
                _command,
                _args,
                _options
            );

            // unrefs by default else runs in foreground and coupled to parent process
            if (_.isUndefined(_this.unref) || _.isNull(_this.unref) || _.isEmpty(_this.unref)) {
                spawn.unref();
            }
            for await (const data of spawn.stdout) {
                yield {data: data.toString(), err: null, code: null};

            }
            for await (const err of spawn.stderr) {
                yield {data: null, err: err.toString(), code: null};
            }

            const return_code = function() {
                return new Promise((resolve) => {
                    spawn.on('close', (code) => {
                        return resolve(code);
                    })
                })
            }
            const rc = await return_code();
            const response = {data: null, err: null, code: rc}
            return yield response;
        }
}

module.exports = backgroundWorker;
