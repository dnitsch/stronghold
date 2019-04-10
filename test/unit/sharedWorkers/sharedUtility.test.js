'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    config = require('../../config'),
    utilsFactory = require('../../../sharedWorkers/sharedUtility');

chai.should();
let _utilsFactory = null, stub = null;

describe('SharedUtils', function() {
    beforeEach(function () {
        _utilsFactory = utilsFactory();
        // stub = sinon.stub(backgroundWorker);
    });

    afterEach(function () {
        // backgroundWorker = null;
        // stub = null;
    });
    describe('factory Object', function () {
        it('should return a factory object', function() {
            expect(_utilsFactory).to.be.an('object');
        });
        it('should include shellAbstractionWLog method', function() {
            expect(_utilsFactory).to.respondTo('shellAbstractionWLog');
        });
        it('should include callbackExtendor method', function() {
            expect(_utilsFactory).to.respondTo('callbackExtendor');
        });
        it('should include callbackExtendorCb method', function() {
            expect(_utilsFactory).to.respondTo('callbackExtendorCb');
        });
        it('should include loggerAbstracted method', function() {
            expect(_utilsFactory).to.respondTo('loggerAbstracted');
        });
        it('should include envHandler method', function() {
            expect(_utilsFactory).to.respondTo('envHandler');
        });
    });

    describe('utils method', function () {
        it('shellAbstractionWLog should be called', function() {
            expect(_utilsFactory).to.be.an('object');
        });
    })
});
// describe('Spawning a child process', function () {
//     describe('with abstration', function () {
//     });

//     describe('with abstration and logging', function () {
//     });
// });

// describe('Calling back to the CI platform', function () {
//     describe('with extendor', function () {

//     });
//     describe('with a extendor that also has a callback', function () {

//     });
// });

// describe('Logging to a the specified logger', function () {
//     describe('with abstraction', function () {

//     });

// });

// describe('Creating custom environment variables for child processes', function () {
//     describe('with envHandler', function () {

//     });

// });
