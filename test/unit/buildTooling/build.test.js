'use strict';

const chai = require('chai'),
      sinon = require('sinon'),
      expect = chai.expect,
      should = chai.should(),
      BuildConf = require('../../../buildTooling/v2/buildToolingWorkerConfigure'),
      config = require('../../config');

describe('Build Operations', function () {
    describe('Configure Operation', function () {
        var buildConf; // = new OrcInit(config.orchestrate.init);
        beforeEach(function () {
            buildConf = new BuildConf(config.build.configure);
            this.enableTimeouts(false)

        });
        it('should be initialised', function () {
            var stub = sinon.stub(buildConf);
            buildConf.pipelineConfigureV2(stub);
            stub.pipelineConfigureV2.called.should.be.true;
        });
        it('should have body', function () {
            should.exist(buildConf.obj.body);
        });
        it('should have STRONGHOLD_tf_init', function () {
            should.exist(buildConf.obj.body.STRONGHOLD_tf_init);
        });
        it('should have STRONGHOLD_cfg_exec', function () {
            should.exist(buildConf.obj.body.STRONGHOLD_cfg_exec);
        });
        it('should have STRONGHOLD_cfg_command', function () {
            should.exist(buildConf.obj.body.STRONGHOLD_cfg_command);
        });
        it('should have STRONGHOLD_cfg_cwd', function () {
            should.exist(buildConf.obj.body.STRONGHOLD_cfg_cwd);
        });
        // envVars
        it('should have envVars in body', function () {
            should.exist(buildConf.obj.body.envVars);
        });
        it('expect envVars.ANSIBLE_LIBRARY to have modules', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_LIBRARY).to.include('modules');
        });
        it('expect envVars.ANSIBLE_VAULT_PASSWORD_FILE to have vault-password-file', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_VAULT_PASSWORD_FILE).to.include('vault-password-file');
        });
        it('expect envVars.ANSIBLE_SSH_RETRIES to have 5', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_SSH_RETRIES).to.equal(5);
        });
        it('expect envVars.ANSIBLE_TF_BIN to have terraform', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_TF_BIN).to.include('terraform');
        });
        it('should have ANSIBLE_TF_DIR in envVars', function () {
            should.exist(buildConf.obj.body.envVars.ANSIBLE_TF_DIR);
        });
        it('expect envVars.ANSIBLE_DEBUG to have 1', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_DEBUG).to.equal(1);
        });
        it('should have ANSIBLE_HOST_KEY_CHECKING in envVars', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_HOST_KEY_CHECKING);
        });
        it('expect envVars.ANSIBLE_CONFIG to have ansible.cfg', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_CONFIG).to.include('ansible.cfg');
        });
        it('should have ANSIBLE_TF_WS_NAME in envVars', function () {
            expect(buildConf.obj.body.envVars.ANSIBLE_TF_WS_NAME);
        });
        // parameters
        it('should have params', function () {
            should.exist(buildConf.obj.params);
        });
        it('should have stage in param ', function () {
            should.exist(buildConf.obj.params.stage);
        });
        it('should have app_name in param ', function () {
            should.exist(buildConf.obj.params.app_name);
        });
        it('should have commit_id in param ', function () {
            should.exist(buildConf.obj.params.commit_id);
        });
        it('should have provider in param ', function () {
            should.exist(buildConf.obj.params.provider);
        });
    });
});
