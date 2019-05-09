'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    config = require('../../config');

chai.should();


chai.should();
describe('Build Factory', function() {
    let orchestrationFactory = null, stub = null;
    beforeEach(function () {
        orchestrationFactory = require('../../../orchestrationTooling/v2/orchestrationFactory')();
    });

    afterEach(function () {
        orchestrationFactory = null;
    });
    describe('workspaceCreate', function () {
        it('should return a factory object', function() {
            expect(orchestrationFactory).to.be.an('object');
        });
        it('should include `workspaceCreate` method', function() {
            expect(orchestrationFactory).to.respondTo('workspaceCreate');
        });
    });
    describe('workspaceDelete', function () {
        it('should return a factory object', function() {
            expect(orchestrationFactory).to.be.an('object');
        });
        it('should include `workspaceDelete` method', function() {
            expect(orchestrationFactory).to.respondTo('workspaceDelete');
        });
    });
    describe('genericOrchestrate', function () {
        it('should return a factory object', function() {
            expect(orchestrationFactory).to.be.an('object');
        });
        it('should include `genericOrchestrate` method', function() {
            expect(orchestrationFactory).to.respondTo('genericOrchestrate');
        });
    });
});
