'use strict';

const _ = require('lodash'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    BackgroundWorker = require('../../../sharedWorkers/backgroundWorker');

chai.should();

let command = "echo";
let err_command = "foo_bar";
let args = ["$TEST"];
let options = {
    cwd: "/bin",
    detached: true,
    env: {
        TEST: "Hello Test World"
    },
    shell: true
}

describe('Background Worker', function () {
    let backgroundWorker = null, stub = null;

    describe('Prototype should be initialised', function() {
        beforeEach(function () {
            backgroundWorker = new BackgroundWorker();
            stub = sinon.stub(backgroundWorker);
        });

        afterEach(function () {
            backgroundWorker = null;
            stub = null;
        });
        // Failing. This test is maybe too much. All other tests will assert this.
        it('should initialise the worker but not call it', function () {
            backgroundWorker.spawnCallerBash(stub);

            // expect(backgroundWorker).to.be.instanceOf(backgroundWorker);
            stub.spawnCallerBash.called.should.be.true;
            // stub.workspaceCreateV2.calledOnce.should.be.true;
            // spy.calledOnce.should.be.false;
            // spy.should.be.instanceOf(backgroundWorker);
        });

        // describe('with a valid bash spawn request', function () {
        it('should call spawnCallerBash once', function () {
            backgroundWorker.spawnCallerBash(stub);
            stub.spawnCallerBash.calledOnce.should.be.true;
        });
    })


    describe('Method calls on SpawnCallerBash', function() {
        beforeEach(function () {
            backgroundWorker = new BackgroundWorker();
        });

        afterEach(function () {
            backgroundWorker = null;
        });
        it('should NOT error when valid data passed in', function (done) {
            // This doesn't work with the sandbox in the beforeEach function statement. Maybe stubbed test must be separate.
            backgroundWorker.spawnCallerBash(command, args, options, function(err, data, code) {
                // backgroundWorker.spawnCallerBash(
                if (err) {
                    done();
                }
                if (data) {
                    expect(data)
                        .to.be.a('string')
                        .and.equal('Hello Test World\n');
                }
                if (_.isNumber(code)) {
                    code.should.equal(0);
                    done();
                }
            });
        });

        it('should error when valid data passed in', function (done) {
            backgroundWorker.spawnCallerBash(err_command, args, options, function(err, data, code) {
                // backgroundWorker.spawnCallerBash(
                if (err) {
                    err.should.contain('command not found');
                    // done();
                }
                // if (data) {
                expect(data).to.be.null;
                        // .to.be.a('string')
                        // .and.equal('Hello Test World\n');
                // }
                if (code) {
                    expect(code).to.be.not.equal(0);
                    done();
                }
            });
        });

        it('arguments should be an Array', function() {
            expect(args).to.be.an('array');
        });
        it('should throw an error without arguments', function() {

        });
        it('should not error', function() {

        });
        it('should be called with these arguments', function() {

        });
        it('should throw an error without arguments', function() {

        });
        it('should return stdout', function() {

        });
        it('should return stderr', function() {

        });
        it('should return uncaughtException', function() {

        });;
        it('should return close', function() {

        });
    })
});
