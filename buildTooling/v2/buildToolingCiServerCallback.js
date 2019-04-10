'use strict';

/**
 * .ctor for BuildServers initializes this class
 * @constructor
 * @param {Express.Request}
 * @returns {BuildServer}
 * @exports BuildServer
 */
function BuildServer (obj) {
    if (!(this instanceof BuildServer)) {
        return new BuildServer(obj);
    }

    this.obj = obj;

    this.selector = (ci_type, callback) => {
        const _ci_type = ci_type;
        const _this = this;
        switch (_ci_type) {
            case "jenkins":
                jenksins(_this.obj, (e, d) => {
                    return callback(e, d);
                });
                break;
            case "gitlab":
                gitlab(_this.obj, (e, d) => {
                    return callback(e, d);
                });
                break;
            case "azuredevops":
                return callback(new Error('Invalid CI server selection. Azure DevOps is not implemented yet.'));
            case "bitbucket":
                return callback(new Error('Invalid CI server selection. Bitbucket is not implemented yet.'));
            default:
                return callback(new Error('Invalid CI server selection. Please select from "jenkins" or "gitlab".'));
        }
    };

    /**
     * @method
     * @param {Express.Request} body
     * @returns {*}
     */
    const jenksins = (obj, callback) => {
        const _obj = obj;
        // initialise only inside the method
        const jenksinsWorker = new (require('../../sharedWorkers/buildServers/jenkins'))(_obj);
        jenksinsWorker.notify((e, d) => {
            return callback(e, d);
        });
    };

    /**
     * @method
     * @param {Express.Request} obj
     * @returns {*}
     */
    const gitlab = (obj, callback) => {
        const _obj = obj;
        // const _body = body, _instruction = instruction;
        const gitlabWorker = new(require('../../sharedWorkers/buildServers/gitlab'))(_obj);
        gitlabWorker.notify((e, d) => {
            return callback(e, d);
        });
    };
    /**
     * ADD further CI server abstractions here, following the below model
     * internal methods
     */
    // /**
    //  * @method
    //  * @param {Express.Request} obj
    //  * @returns {*}
    //  */
    // const azuredevops = (obj, callback) => {
    //     const _obj = obj;
    //     // const _body = body, _instruction = instruction;
    //     const gitlabWorker = new(require('../sharedWorkers/buildServers/azure'))(_obj);
    //     gitlabWorker.notify((e, d) => {
    //         return callback(e, d);
    //     });
    // };

    return this;
}

module.exports = BuildServer;


