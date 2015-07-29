/* globals describe, it, beforeEach, afterEach */

'use strict';

var assert = require('chai').assert,
    mockery = require('mockery');

describe('Install Test Suite', function () {
    var sutPath = '../../commands/install.js',
        install,
        execMock,
        hostList,
        command,
        context,
        config,
        logger,
        next;

    beforeEach(function () {
        command = {
            args: ['unit1-test1-lh.manhattan'],
            options: {
                'igor-tag': ''
            }
        };
        hostList = {
            'unit1-test1.sp1.medium.com':
                ['unit1-test1-lh1.sp1.medium.com',
                    'unit1-test1-lh2.sp1.medium.com'],
            'unit1-test2.sp1.medium.yahoo.com':
                ['unit1-test2-lh1.sp1.medium.com',
                    'unit1-test2-lh2.sp1.medium.yahoo.com']
        };
        logger = {
            verbose: true,
            log: function () {
            },
            error: function () {
            }
        };
        config = {
            'node-admin' : {
                'igor-tag' : ''
            }
        }
        context = {
            logger: logger,
            command: command,
            hostList: hostList,
            config: config
        };
        execMock = {
            exec: function (cmd, cb) {
                process.nextTick(function () {
                    cb(null);
                });
            }
        };
        mockery.enable({useCleanCache: true});
        mockery.registerAllowable('async');
        mockery.registerMock('child_process', execMock);
        mockery.registerAllowable(sutPath, true);
        install = require(sutPath);
    });

    afterEach(function () {
        context = null;

        mockery.deregisterAll();
        mockery.disable();
    });

    it('should not fail to run pogo job', function (done) {
        execMock.exec = function (cmd, cb) {
            process.nextTick(function () {
                cb(null);
            });
        }

        next = function (error) {
            assert.isNull(error, 'Error should be null');
            done();
        };
        install(context, next);
    });

    it('should fail install if invalid node-admin tag is specified', function (done) {
        command.options['igor-tag'] = 'mobile.TAG_WIDGETS_1_0_17_1';

        next = function (error) {
            assert.isTrue(error instanceof Error);
            assert.isNotNull(error, 'expected error to be set');
            assert.strictEqual('Not a valid manhattan node-admin igor-tag.',
                error.message, 'Error message does not match when boot command fails');
            done();
        };
        install(context, next);
    });

    it('should fail gracefully when child process fails to execute pogo task', function (done) {
        execMock.exec = function (cmd, cb) {
            process.nextTick(function () {
                cb(new Error());
            });
        }

        next = function (error) {
            assert.isTrue(error instanceof Error);
            assert.isNotNull(error, 'Error should not be null');
            assert.strictEqual('POGO Command: \"yinst restore -igor -live -igor_tag \"  failed with error Error',
                error.message, 'Error message doesnt match when pogo job fails');
            done();
        };
        install(context, next);
    });
});
