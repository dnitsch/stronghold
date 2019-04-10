'use strict';
// / <reference path="." />
// jshint expr: true

const chai = require('chai'),
      sinon = require('sinon'),
      expect = chai.expect,
      should = chai.should(),
      ConfigRunPlay = require('../../../configurationTooling/v2/configurationWorker'),
      config = require('../../config');

describe('Ansible Operations', function () {
    describe('Run Playbook', function () {
        var configRunPlay; // = new OrcInit(config.orchestrate.init);
        beforeEach(function () {
            configRunPlay = new ConfigRunPlay(config.configure.runplaybook);
        });
        afterEach(function () {
            configRunPlay = null;
        });
        // it('should be initialised', function () {
        //     // orcInit = new OrcInit(config.orchestrate.init);
        //     // var stub = sinon.stub(orcInit, 'initialize');
        //     var stub = sinon.stub(configRunPlay);
        //     configRunPlay.runConfigV2(stub);
        //     // stub(config.orchestrate.init, stub.initialize);
        //     stub.runConfigV2.called.should.be.true;
        //     // expect(true).to.be.true
        // });
        it('should have body', function () {
            should.exist(configRunPlay.obj.body);
        });
        // envVars
        it('should have envVars in body', function () {
            should.exist(configRunPlay.obj.body.envVars);
        });
        it('expect envVars.ANSIBLE_LIBRARY to have modules', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_LIBRARY).to.include('modules');
        });
        it('expect envVars.ANSIBLE_VAULT_PASSWORD_FILE to have vault-password-file', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_VAULT_PASSWORD_FILE).to.include('vault-password-file');
        });
        it('expect envVars.ANSIBLE_SSH_RETRIES to have 5', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_SSH_RETRIES).to.equal(5);
        });
        it('expect envVars.ANSIBLE_TF_BIN to have terraform', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_TF_BIN).to.include('terraform');
        });
        it('should have ANSIBLE_TF_DIR in envVars', function () {
            should.exist(configRunPlay.obj.body.envVars.ANSIBLE_TF_DIR);
        });
        it('expect envVars.ANSIBLE_DEBUG to have 1', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_DEBUG).to.equal(1);
        });
        it('should have ANSIBLE_HOST_KEY_CHECKING in envVars', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_HOST_KEY_CHECKING);
        });
        it('expect envVars.ANSIBLE_CONFIG to have ansible.cfg', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_CONFIG).to.include('ansible.cfg');
        });
        it('should have ANSIBLE_TF_WS_NAME in envVars', function () {
            expect(configRunPlay.obj.body.envVars.ANSIBLE_TF_WS_NAME);
        });
        // parameters
        it('should have params', function () {
            should.exist(configRunPlay.obj.params);
        });
        it('should have stage in param ', function () {
            should.exist(configRunPlay.obj.params.stage);
        });
        it('should have app_name in param ', function () {
            should.exist(configRunPlay.obj.params.app_name);
        });
        it('should have commit_id in param ', function () {
            should.exist(configRunPlay.obj.params.commit_id);
        });
        it('should have provider in param ', function () {
            should.exist(configRunPlay.obj.params.provider);
        });
    });
    // TODO: negative assertions go here
});
