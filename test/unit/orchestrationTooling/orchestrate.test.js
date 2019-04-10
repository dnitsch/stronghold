// / <reference path="." />
'use strict';
// jshint expr: true

const chai = require('chai'),
      sinon = require('sinon'),
      expect = chai.expect,
      should = chai.should(),
      OrcInit = require('../../../orchestrationTooling/v1/orchestrationDirectInit'),
      OrcWsCreate = require('../../../orchestrationTooling/v2/orchestrationWorkspaceCreate'),
      OrcWsDelete = require('../../../orchestrationTooling/v2/orchestrationWorkspaceDelete'),
      config = require('../../config');



describe('Terraform Operations', function () {

    describe('Init Operation', function () {
        var orcInit;
        beforeEach(function () {
            orcInit = new OrcInit(config.orchestrate.init);
        });
        afterEach(function () {
            orcInit = null;
        });
        // it('should be initialised', function () {
        //     // orcInit = new OrcInit(config.orchestrate.init);
        //     // var stub = sinon.stub(orcInit, 'initialize');
        //     var stub = sinon.stub(orcInit);
        //     orcInit.initialize(stub);
        //     // stub(config.orchestrate.init, stub.initialize);
        //     stub.initialize.called.should.be.true;
        //     // expect(true).to.be.true
        // });
        it('should have body', function () {
            should.exist(orcInit.obj.body);
        });
        it('should have params', function () {
            should.exist(orcInit.obj.params);
        });
    });
    describe('WorkspaceCreate Operation', function () {
        let stub = null, orcWsCreate = null;
        beforeEach(function () {
            orcWsCreate = new OrcWsCreate(config.orchestrate.init);
            stub = sinon.stub(orcWsCreate);
            orcWsCreate.workspaceCreateV2(stub);
        });
        afterEach(function () {
            orcWsCreate = null;
        });
        it('should be initialised', function () {
            stub.workspaceCreateV2.called.should.be.true;
            stub.workspaceCreateV2.calledOnce.should.be.true;
        });
        it('should have body', function () {
            orcWsCreate.obj.should.haveOwnProperty('body');
        });
        it('should have params', function () {
            orcWsCreate.obj.should.haveOwnProperty('params');
            // should.exist(orcWsCreate.obj.params);
        });
    });

    describe('WorkspaceDelete Operation', function () {
        let orcWsDelete = null, stub = null;
        beforeEach(function () {
            orcWsDelete = new OrcWsDelete(config.orchestrate.init);
            stub = sinon.stub(orcWsDelete);
            orcWsDelete.workspaceDeleteV2(stub);
        });
        afterEach(function () {
            orcWsDelete = null;
        });
        it('should be initialised', function () {
            stub.workspaceDeleteV2.called.should.be.true;
            stub.workspaceDeleteV2.calledOnce.should.be.true;
            // expect(true).to.be.true
        });
        it('should have body', function () {
            should.exist(orcWsDelete.obj.body);
        });
        it('should have params', function () {
            should.exist(orcWsDelete.obj.params);
        });
    });
    // negative assertions
});
