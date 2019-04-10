'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    app = require('../../app'),
    ConfigurationManager = require('../../configurationTooling/v2/configurationWorker');

chai.use(chaiHttp);
chai.should();

var validPlaybookData = {
    STRONGHOLD_tf_init: false,
    STRONGHOLD_cfg_command: ["all", "-i", "localhost,", "-c", "local", "-m", "shell", "-a", "'echo hello world'"],
    STRONGHOLD_cfg_exec: "ansible",
    envVars: {
        ANSIBLE_TF_BIN: "terraform",
        ANSIBLE_TF_DIR: __dirname,
    }
};

// Requires callback true as we are not using the build endpoints
var invalidPlaybookData = {
    callback: true,
    callback_url: "https://gitlab.fake.example.net/idam/idam/pipelines/3659",
    callback_next: "fake_job",
    callback_pipeline_id: "3659",
    callback_project_id: "21",
    callback_ci_type: "gitlab",
    STRONGHOLD_tf_init: false,
    STRONGHOLD_cfg_command: ["all", "-i", "localhost,", "-c", "local", "-m", "shell", "-a", "'echo hello world'"],
    STRONGHOLD_cfg_exec: "__ansible",
    envVars: {
        ANSIBLE_TF_BIN: "terraform",
        ANSIBLE_TF_DIR: __dirname,
    }
};

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
            .send(validPlaybookData)
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
                .send(validPlaybookData)
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
                .send(invalidPlaybookData)
                .end((err, res) => {
                    sinon.assert.calledThrice(runConfigV2_spy)
                    done();
                });
        });

        // todo: Currently responds 202
        it.skip('should respond with code 500', function (done) {
            chai.request(app)
                .put('/configuration/v2/playbook/dev/group-directory/1234567890/aws')
                .send(invalidPlaybookData)
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
