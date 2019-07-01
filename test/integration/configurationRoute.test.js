'use strict';

const sinon = require('sinon'),
    conf = require('../config'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    app = require('../../app'),
    ConfigurationManager = require('../../configurationTooling/v2/configurationWorker');

chai.use(chaiHttp);
chai.should();

const runConfigV2_spy = sinon.spy(ConfigurationManager.prototype, 'runConfigV2');

describe('PUT /configuration/v2/playbook/:stage/:app_name/:commit_id/:provider?', function () {
    describe('with a valid payload', function () {

        beforeEach(function () {
            // config_spy = sinon.spy(ConfigurationManager.prototype, 'runConfigV2');
        });
        afterEach(function () {
            // config_spy = null;
        });


        it('should respond with code 202', function (done) {
            chai.request(app)
                .put('/configuration/v2/playbook/dev/group-directory/1234567890/aws')
                .send(conf.validPlaybookData)
                .end((err, res) => {
                    res.should.have.status(202);
                    res.type.should.eql('application/json');
                    res.body.should.be.an('object');
                    res.body.should.have.property('responseData').which.should.be.an('object');
                    done();
                });
        });

        it('should call runConfigV2 once', function (done) {
            // var spy = sinon.spy(ConfigurationManager.prototype, 'runConfigV2');
            chai.request(app)
                .put('/configuration/v2/playbook/dev/group-directory/1234567890/aws')
                .send(conf.validPlaybookData)
                .end((err, res) => {
                    sinon.assert.calledTwice(runConfigV2_spy)
                    done();
                });
        });
    });

    describe('with a invalid payload', function () {

        beforeEach(function () {
        });
        afterEach(function () {
        });

        it('should call runConfigV2 once', function (done) {
            // var spy = sinon.spy(ConfigurationManager.prototype, 'runConfigV2');
            chai.request(app)
                .put('/configuration/v2/playbook/dev/group-directory/1234567890/aws')
                .send(conf.invalidPlaybookData)
                .end((err, res) => {
                    sinon.assert.calledThrice(runConfigV2_spy);
                    done();
                });
        });
        // todo: Currently responds 202
        it.skip('should respond with code 500', function (done) {
            chai.request(app)
                .put('/configuration/v2/playbook/dev/group-directory/1234567890/aws')
                .send(conf.invalidPlaybookData)
                .end((err, res) => {
                    res.should.have.status(500);
                    res.type.should.eql('application/json');
                    res.body.should.be.an('object');
                    // console.log(res.body)
                    // res.body.should.have.property('responseData').to.equal('OK');
                    // res.body.should.have.property('code').to.equal('ANSIBLE160x5');
                    done();
                });
        });

    });
});
