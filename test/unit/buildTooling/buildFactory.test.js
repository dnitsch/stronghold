'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    config = require('../../config');
    // buildFactory = require('../../../buildTooling/v2/buildToolingFactory')();
    // ProvisionCreate = require('../../../buildTooling/v2/buildToolingWorkerProvisionCreate'),
    // Checkout = require('../../../buildTooling/v2/buildToolingWorkerGitCheckout'),
    // Configure = require('../../../buildTooling/v2/buildToolingWorkerConfigure'),
    // Destroy = require('../../../buildTooling/v2/buildToolingWorkerProvisionDestroy'),
    // Notify = require('../../../buildTooling/v2/buildToolingCiServerCallback');

chai.should();


chai.should();
describe('Build Factory', function() {
    let buildFactory = null, stub = null;
    beforeEach(function () {
        // buildFactory = require('../../../sharedWorkers/logger');
        buildFactory = require('../../../buildTooling/v2/buildToolingFactory')();
        // _utilsFactory = utilsFactory();
        // stub = sinon.stub(logger);
    });

    afterEach(function () {
        buildFactory = null;
    });
    describe('GitCheckout', function () {
        it('should return a factory object', function() {
            expect(buildFactory).to.be.an('object');
        });
        it('should include `gitCheckout` method', function() {
            expect(buildFactory).to.respondTo('gitCheckout');
        });
    });
    describe('configure', function () {
        it('should return a factory object', function() {
            expect(buildFactory).to.be.an('object');
        });
        it('should include `configure` method', function() {
            expect(buildFactory).to.respondTo('configure');
        });
    });
    describe('orchestrate', function () {
        it('should return a factory object', function() {
            expect(buildFactory).to.be.an('object');
        });
        it('should include `orchestrate` method', function() {
            expect(buildFactory).to.respondTo('orchestrate');
        });
    });
    describe('destroy', function () {
        it('should return a factory object', function() {
            expect(buildFactory).to.be.an('object');
        });
        it('should include `destroy` method', function() {
            expect(buildFactory).to.respondTo('destroy');
        });
    });
    describe('notify', function () {
        it('should return a factory object', function() {
            expect(buildFactory).to.be.an('object');
        });
        it('should include `notify` method', function() {
            expect(buildFactory).to.respondTo('notify');
        });
    });
});
