'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    config = require('../../config');

chai.should();


chai.should();
describe('Build Factory', function() {
    let configurationFactory = null, stub = null;
    beforeEach(function () {
        configurationFactory = require('../../../configurationTooling/v2/configurationFactory')();
    });

    afterEach(function () {
        configurationFactory = null;
    });
    describe('playbookConfigure', function () {
        it('should return a factory object', function() {
            expect(configurationFactory).to.be.an('object');
        });
        it('should include `playbookConfigure` method', function() {
            expect(configurationFactory).to.respondTo('playbookConfigure');
        });
        describe.skip('run config playbook', function() {
            beforeEach(function () {
            });
            it('should call playbookConfigre at least once', function() {
                configurationFactory.playbookConfigure(config.configure.runplaybook, sinon.fake());
                var run = sinon.spy(configurationFactory.playbookConfigure);
                run.calledOnce.should.be.true;
                // expect(configurationFactory).to.respondTo('playbookConfigure');
            });
        });
    });
});
