var assert = require('assert');

var config = require('../config'),
    events = require('events');

describe('Logger Test', function() {
    describe('test logger', function() {
        it('should log in file and console, when in console log is colored', function(done) {
            var logger = require('bicycle/logger');
            logger.configure(config.logger);
            logger = logger.getLogger(config.appName, __filename);
            logger.debug('this is a debug log.');
            logger.info('this is an info log.');
            logger.error('this is an error log.', new Error('test logger error.'));
            logger.trace('this is a trace log.');
            logger.warn('this is a warn log.');
            logger.fatal('this is a fatal log.');
            done();
        });
    });
});