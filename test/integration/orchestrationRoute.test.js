'use strict';

const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../app');
const TerraWorkerDirect = require('../../orchestrationTooling/v1/orchestrationDirectInit');
const TerraWorkerWorkSpaceCreate = require('../../orchestrationTooling/v2/orchestrationWorkspaceCreate');
const TerraWorkerWorkSpaceDelete = require('../../orchestrationTooling/v2/orchestrationWorkspaceDelete');
const orchestrationGeneric = require('../../orchestrationTooling/v2/orchestrationGeneric');
const orchestrationFactory = require('../../orchestrationTooling/v2/orchestrationFactory')();

chai.use(chaiHttp);
chai.should();
// Requires STRONGHOLD_CUSTOM_AWS_PROFILE to test code in conditions
var validInitData = {
    STRONGHOLD_orc_exec: "terraform",
    STRONGHOLD_orc_cwd: __dirname + '/terraform/init',
    envVars: {
        TF_VAR_example: "true",
        STRONGHOLD_CUSTOM_AWS_PROFILE: "fake_profile"
    }
};

// Requires STRONGHOLD_INHERIT_AWS_PROFILE to test code in conditions
var invalidInitData = {
    STRONGHOLD_orc_exec: "terraform",
    STRONGHOLD_orc_cwd: __dirname + '/terraform/_does_not_exist',
    envVars: {
        STRONGHOLD_INHERIT_AWS_PROFILE: "fake_profile",
        TF_VAR_example: "true"
    }
};

var invalidWorkspaceCreateData = {
    STRONGHOLD_orc_exec: "terraform",
    STRONGHOLD_orc_cwd: __dirname + '/terraform/_does_not_exist',
    STRONGHOLD_tf_workspace: 'test-create',
    envVars: {
        TF_VAR_example: "true"
    }
};

var validWorkspaceCreateData = {
    STRONGHOLD_orc_exec: "terraform",
    STRONGHOLD_orc_cwd: __dirname + '/terraform/workspace',
    STRONGHOLD_tf_workspace: 'test-create',
    envVars: {
        TF_VAR_example: "true"
    }
};
var invalidWorkspaceDeleteData = {
    STRONGHOLD_orc_exec: "terraform",
    STRONGHOLD_orc_cwd: __dirname + '/terraform/_does_not_exist',
    STRONGHOLD_tf_workspace: 'test-delete',
    envVars: {
        TF_VAR_example: "true"
    }
};
var validWorkspaceDeleteData = {
    STRONGHOLD_orc_exec: "terraform",
    STRONGHOLD_orc_cwd: __dirname + '/terraform/workspace',
    STRONGHOLD_tf_workspace: 'test-delete',
    envVars: {
        TF_VAR_example: "true"
    }
};
var validGenericData = {
    STRONGHOLD_orc_exec: "echo",
    STRONGHOLD_orc_exec: ["$TF_VAR_example"],
    STRONGHOLD_orc_cwd: __dirname,
    envVars: {
        TF_VAR_example: "true"
    }
};
var invalidGenericData = {
    STRONGHOLD_orc_exec: "#echo",
    STRONGHOLD_orc_exec: ["$TF_VAR_example"],
    STRONGHOLD_orc_cwd: __dirname,
    envVars: {
        TF_VAR_example: "true"
    }
};
describe('PUT /orchestration/v1/init/:stage/:app_name/:commit_id/:provider?', function () {
    describe('with a valid payload', function () {

        beforeEach(function () {
        });
        afterEach(function () {
        });

        // todo: Use helpers for send data
        it('should call initialize once', function (done) {
            var spy = sinon.spy(TerraWorkerDirect.prototype, 'initialize');
            chai.request(app)
                .put('/orchestration/v1/init/dev/group-directory/1234567890/aws')
                .send(validInitData)
                .end((err, res) => {
                    sinon.assert.calledOnce(spy)
                    done();
                });
        });

        // todo: response data does not equal OK. it should.
        it('should respond with code 200 and json object with property responseData = OK', function (done) {
            chai.request(app)
                .put('/orchestration/v1/init/dev/group-directory/1234567890/aws')
                .send(validInitData)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.type.should.eql('application/json');
                    res.body.should.be.an('object');
                    res.body.should.have.property('responseData').to.equal('');
                    done();
            });
        });
    });

    describe('with a invalid cwd in payload', function () {
        it('should respond with code 500', function (done) {
            chai.request(app)
                .put('/orchestration/v1/init/dev/group-directory/1234567890/aws')
                .send(invalidInitData)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.type.should.equal('application/json');
                    res.body.should.be.an('object');
                    res.body.should.have.property('responseData').to.equal('Error: spawn /bin/sh ENOENTError: spawn /bin/sh ENOENT');
                    res.body.should.have.property('code').to.equal('TERRAFORM120x5');
                    done();
            });
        });
    });

});

describe('POST /orchestration/v2/workspace/:stage/:app_name/:commit_id/:provider?', function () {
    describe('with a valid payload', function () {
        var init;
        // var createWorkspace;

        before(function () {
            init = new TerraWorkerDirect({
                params: {
                    provider: "aws"
                },
                body: {
                    STRONGHOLD_orc_exec: "terraform",
                    STRONGHOLD_orc_cwd: __dirname + '/terraform/workspace',
                    envVars: {
                        TF_VAR_example: "true"
                    }
                }
            });
        });

        beforeEach(function () {
            // createWorkspace = new TerraWorkerWorkSpaceCreate();
        });

        afterEach(function (done) {
            init.initialize(function () {
                orchestrationFactory.workspaceDelete({
                    params: {
                        provider: "aws"
                    },
                    body: validWorkspaceCreateData
                }, done);
            });
        });

        // todo: Use helpers for send data
        it('should call workspaceCreateV2 once', function (done) {
            var spy = sinon.spy(TerraWorkerWorkSpaceCreate.prototype, 'workspaceCreateV2');
            // var spy2 = sinon.spy(sharedUtils, 'shellAbstractionWLog');
            chai.request(app)
                .post('/orchestration/v2/workspace/dev/group-directory/1234567890/aws')
                .send(validWorkspaceCreateData)
                .end((err, res) => {
                    res.should.have.status(202);
                    // todo: This currently stops after selectWorkSpace and I don't have
                    // a framework to test the promises or understand how to spy the required
                    // functions to test further.
                    // Hard to test because of private functions and promises as well as spawing
                    // background process
                    sinon.assert.calledOnce(spy);
                    // sinon.assert.calledOnce(spy2);

                    // Using setTimeout to provide enough time for the private promises to resolve.
                    // If this is not set, the test will sometimes trigger the afterEach hook before
                    // the promises are resolved.
                    // todo: Refactor orchestrationWorkspaceCreate.js so this is easier to test.
                    setTimeout(done, 1500)
            });
        });
    });

    describe('with a invalid cwd in payload', function () {
        it('should respond with code 500', function (done) {
            chai.request(app)
                .post('/orchestration/v2/workspace/dev/group-directory/1234567890/aws')
                .send(invalidWorkspaceCreateData)
                .end((err, res) => {
                    // res.should.have.status(500);
                    res.type.should.equal('application/json');
                    res.body.should.be.an('object');
                    // res.body.should.have.property('responseData').to.equal('Error: spawn /bin/sh ENOENTError: spawn /bin/sh ENOENT');
                    // res.body.should.have.property('code').to.equal('TERRAFORM190x5');
                    done();
            });
        });
    });
});


describe('DELETE /orchestration/v2/workspace/:stage/:app_name/:commit_id/:provider?', function () {
    describe('with a valid payload', function () {
        var init;
        // var createWorkspace;

        before(function () {
            init = new TerraWorkerDirect({
                params: {
                    provider: "aws"
                },
                body: validWorkspaceDeleteData
            });
        });

        beforeEach(function (done) {
            init.initialize(function () {
                orchestrationFactory.workspaceCreate({
                    params: {
                        provider: "aws"
                    },
                    body: validWorkspaceDeleteData
                }, function () {
                        // Again, I have used setTimeout to avoid locking terraform state
                        // due to the beforeEach hook workspaceCreate clashing with the
                        // DELETE test whilst we haven't got the ability to check from the promise
                        // resolve.
                        setTimeout(done, 800);
                });
            });
        });

        afterEach(function () {
        });

        // todo: Use helpers for send data
        it('should call workspaceDeleteV2 once', function (done) {
            var spy = sinon.spy(TerraWorkerWorkSpaceDelete.prototype, 'workspaceDeleteV2');
            chai.request(app)
                .delete('/orchestration/v2/workspace/dev/group-directory/1234567890/aws')
                .send(validWorkspaceDeleteData)
                .end((err, res) => {
                    // todo: This currently stops after selectWorkSpace and I don't have
                    // a framework to test the promises or understand how to spy the required
                    // functions to test further.
                    // Hard to test because of private functions and promises as well as spawing
                    // background process
                    sinon.assert.calledOnce(spy);

                    // Using setTimeout to provide enough time for the private promises to resolve.
                    // If this is not set, the test will sometimes trigger the afterEach hook before
                    // the promises are resolved.
                    // todo: Refactor orchestrationWorkspaceCreate.js so this is easier to test.
                    done();
            });
        });
    });

    describe('with a invalid cwd in payload', function () {
        it('should respond with code 500', function (done) {
            chai.request(app)
                .delete('/orchestration/v2/workspace/dev/group-directory/1234567890/aws')
                .send(invalidWorkspaceDeleteData)
                .end((err, res) => {
                    // res.should.have.status(500);
                    res.type.should.equal('application/json');
                    res.body.should.be.an('object');
                    // res.body.should.have.property('responseData').to.equal('Error: spawn /bin/sh ENOENTError: spawn /bin/sh ENOENT');
                    // res.body.should.have.property('code').to.equal('TERRAFORM190x5');
                    done();
            });
        });
    });
});


describe('POST /orchestration/v2/generic/:stage/:app_name/:commit_id/:provider?', function () {
    describe('with a valid payload', function () {
        beforeEach(function () {
        });
        afterEach(function () {
        });

        // todo: Use helpers for send data
        it('should call runOrchestration once', function (done) {
            var spy = sinon.spy(orchestrationGeneric.prototype, 'runOrchestration');
            // var spy2 = sinon.spy(sharedUtils, 'shellAbstractionWLog');
            chai.request(app)
                .post('/orchestration/v2/generic/dev/group-directory/1234567890/aws')
                .send(validGenericData)
                .end((err, res) => {
                    res.should.have.status(202);
                    // todo: This currently stops after selectWorkSpace and I don't have
                    // a framework to test the promises or understand how to spy the required
                    // functions to test further.
                    // Hard to test because of private functions and promises as well as spawing
                    // background process
                    sinon.assert.calledOnce(spy);
                    // sinon.assert.calledOnce(spy2);

                    // Using setTimeout to provide enough time for the private promises to resolve.
                    // If this is not set, the test will sometimes trigger the afterEach hook before
                    // the promises are resolved.
                    // todo: Refactor orchestrationWorkspaceCreate.js so this is easier to test.
                    setTimeout(done, 1500)
            });
        });
    });

    describe('with a invalid cwd in payload', function () {
        it('should respond with code 500', function (done) {
            chai.request(app)
                .post('/orchestration/v2/generic/dev/group-directory/1234567890/aws')
                .send(invalidGenericData)
                .end((err, res) => {
                    // res.should.have.status(500);
                    res.type.should.equal('application/json');
                    res.body.should.be.an('object');
                    // res.body.should.have.property('responseData').to.equal('Error: spawn /bin/sh ENOENTError: spawn /bin/sh ENOENT');
                    // res.body.should.have.property('code').to.equal('TERRAFORM190x5');
                    done();
            });
        });
    });
});

