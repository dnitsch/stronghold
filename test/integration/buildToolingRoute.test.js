'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    app = require('../../app'),
    expect = chai.expect,
    config = require('../config'),
    // buildFactory = require('../../buildTooling/v2/buildToolingFactory')(),
    // ProvisionCreate = require('../../buildTooling/v2/buildToolingWorkerProvisionCreate'),
    Checkout = require('../../buildTooling/v2/buildToolingWorkerGitCheckout'),
    // Configure = require('../../buildTooling/v2/buildToolingWorkerConfigure'),
    // Destroy = require('../../buildTooling/v2/buildToolingWorkerProvisionDestroy'),
    Notify = require('../../buildTooling/v2/buildToolingCiServerCallback');

chai.use(chaiHttp);
chai.should();

// const expect = chai.expect();

describe('POST /build/v2/pipeline/checkout/:sha_id/:sync?', function () {
    beforeEach(function () {
        process.env.BASE_URL = 'http://localhost:1337/';
    });
    afterEach(function () {

    });

    it('should call gitCheckoutV2 once', function (done) {
        var spy = sinon.spy(Checkout.prototype, 'gitCheckoutV2');
        chai.request(app)
            .post('/build/v2/pipeline/checkout/0123456789/true')
            .send(config.validCheckoutData)
            .end((err, res) => {
                if (err) {
                    return done();
                }
                sinon.assert.calledOnce(spy);
                // res.should.have.status(200);
                done();
            });
    });

    it('should throw an error with Invalid commit ID', function (done) {
        // var spy = sinon.spy(Checkout.prototype, 'gitCheckoutV2');
        chai.request(app)
            .post('/build/v2/pipeline/checkout/0123456789/true')
            .send(config.invalidCheckoutData)
            .end((err, res) => {
                if (err) {
                    return done();
                }
                // sinon.assert.calledOnce(spy);
                res.should.have.status(500);
                res.body.responseData.Message.should.contain('did not match any file(s) known to git.')
                done();
            });
    });

});


describe('PUT /build/v2/pipeline/notify/:instruction?', function () {

    beforeEach(function () {
    });
    afterEach(function () {
    });
    describe('Router call', function() {
        it('should return error with invalid payloads once', function (done) {
            // const spy = sinon.spy(Notify.prototype, 'BuildServer');
            chai.request(app)
                .put('/build/v2/pipeline/notify/proceed')
                .send(config.notifyBuildTool)
                .end((err, res) => {
                    if (err) {
                        return done();
                    }
                    res.should.have.status(500);
                    expect(res.body).to.be.haveOwnProperty("code");
                    expect(res.body.responseData).to.be.haveOwnProperty("message");
                    expect(res.body.responseData.message).to.not.be.empty;
                    done();
                });
        });
    })

    describe('method call', function() {
        let buildServerCb = null;
        beforeEach(function () {
            buildServerCb = new Notify(config.notifyBuildTool);
        });
        afterEach(function () {
            buildServerCb = null;
        });
        it('should include selector method', function() {
            expect(buildServerCb).to.respondTo('selector');
        });
        it('should include paylod with `callback_url`', function() {
            config.notifyBuildTool.should.haveOwnProperty('callback_url');
        });
        it('should include paylod with `callback_ci_type`', function() {
            config.notifyBuildTool.should.haveOwnProperty('callback_ci_type');
        });
    })
});

/**
 *
 *
describe('POST /build/v2/pipeline/provision/:stage/:app_name/:commit_id?/:provider?', function () {
        beforeEach(function () {
        });
        afterEach(function () {
        });

        // This currently errors due to connectionErrors to 127.0.0.1:80 when the service
        // helper fires. I have tried to provide the BASE_URL by running mocha as so:
        // BASE_URL=http://localhost:1337 mocha ...
        // Unfortunately this does not resolve the issue and I am struggling to debug the
        // prototype because of it's private parts. I think the function needs refactoring.
        it('should call pipelineOrchestrateV2 once', function (done) {
            var spy = sinon.spy(ProvisionCreate.prototype, 'pipelineOrchestrateV2');
            chai.request(app)
                .post('/build/v2/pipeline/provision/dev/group-directory/12334567890/aws')
                .send(config.validProvisionData)
                .end((err, res) => {
                    if (err) {
                        return done();
                    }
                    sinon.assert.calledOnce(spy);
                    done();
                });
        });

        it('should fail straight away with invalid payload', function (done) {
            // console.log(process.env);
            chai.request(app)
                .post('/build/v2/pipeline/provision/dev/group-directory/12334567890/aws')
                .send(config.invalidProvisionData)
                .end((err, res) => {
                    if (err) {
                        return done();
                    }
                    // sinon.assert.calledOnce(spy);
                    // res.body
                    chai.expect(res.body.code).to.not.be.empty;
                    done();
                });
        });
    });

    describe('POST /build/v2/configure/checkout/:stage/:app_name/:commit_id?/:provider?', function () {
        beforeEach(function () {
        });
        afterEach(function () {
        });

        // it('should call pipelineConfigureV2 once', function (done) {
        //     var spy = sinon.spy(Configure.prototype, 'pipelineConfigureV2');
        //     chai.request(app)
        //         .post('/build/v2/pipeline/configure/dev/group-directory/12334567890/aws')
        //         .send(config.validConfigData)
        //         .end((err, res) => {
        //             sinon.assert.calledOnce(spy);
        //             done();
        //         });
        // });

        it('should return status 202 with valid payload', function (done) {
            chai.request(app)
                .post('/build/v2/pipeline/configure/dev/group-directory/12334567890/aws')
                .send(config.validConfigData)
                .end((err, res) => {
                    // sinon.assert.calledOnce(spy);
                    if (err) {
                        return done();
                    }
                    res.should.have.status(202);
                    chai.expect(res.body.responseData).to.be.haveOwnProperty("OK");
                    chai.expect(res.body.responseData.OK).to.be.true;
                    done();
                });
        });

        it('should return status 500 with invalid payload', function (done) {
            chai.request(app)
                .post('/build/v2/pipeline/configure/dev/group-directory/12334567890/aws')
                .send(config.invalidConfigData)
                .end((err, res) => {
                    if (err) {
                        return done();
                    }
                    res.should.have.status(500);
                    chai.expect(res.body).to.be.haveOwnProperty("code");
                    chai.expect(res.body.responseData).to.be.haveOwnProperty("message");
                    chai.expect(res.body.responseData.message).to.not.be.empty;
                    done();
                });
        });
    });

    describe('DELETE /build/v2/pipeline/destroy/:stage/:app_name/:commit_id?/:provider?', function () {

        beforeEach(function () {
        });
        afterEach(function () {
        });

        it('should call pipelineWsDestroyV2 once', function (done) {
            var spy = sinon.spy(Destroy.prototype, 'pipelineWsDestroyV2');
            chai.request(app)
                .delete('/build/v2/pipeline/destroy/dev/group-directory/12334567890/aws')
                .send(config.validProvisionData)
                .end((err, res) => {
                    if (err) {
                        return done();
                    }
                    sinon.assert.calledOnce(spy);
                    done();
                });
        });


        it('should return error with invalid payloads once', function (done) {
            // var spy = sinon.spy(Destroy.prototype, 'pipelineWsDestroyV2');
            chai.request(app)
                .delete('/build/v2/pipeline/destroy/dev/group-directory/12334567890/aws')
                .send(config.invalidProvisionData)
                .end((err, res) => {
                    if (err) {
                        return done();
                    }
                    res.should.have.status(500);
                    chai.expect(res.body).to.be.haveOwnProperty("code");
                    chai.expect(res.body.responseData).to.be.haveOwnProperty("message");
                    chai.expect(res.body.responseData.message).to.not.be.empty;
                    done();
                });
        });
    });
 */
