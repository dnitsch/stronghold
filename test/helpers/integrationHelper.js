// todo: improve and provide more example json bodies for integration testing
var strongholdRequestHelpers = {
    PutInit: {
        STRONGHOLD_orc_exec: "terraform",
        STRONGHOLD_orc_cwd: __dirname + '/terraform/init',
        envVars: {
            TF_VAR_example: "true"
        }
    }
};

module.exports = strongholdRequestHelpers
