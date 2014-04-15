var assert = require('assert');

var config = require('../config');

describe('Compiler Test', function() {
    describe.only('test compiler', function() {
        it('should generate compiled js and html files', function(done) {
            require('bicycle/compiler.js').compile({
                dirname: 'public/views',
                template: 'public/views/template.html',
                htmlfiles: ['login/login', 'dashboard', 'index', 'http/http500', 'http/http404'],
                viewbasepath: '/views/',
                databasepath: '/webapi/'
            });
            done();
        });
    });
    describe('#relativePath', function() {
        it('should return the right relative path', function() {
            var relativePath = require('bicycle/compiler.js').relativePath;
            assert.equal(relativePath('xx/1/2.dust', 'xx/1/3/4.dust'), '../2.dust');
            assert.equal(relativePath('1', ''), '1');
            assert.equal(relativePath('', '2/3.dust'), '../');
            assert.equal(relativePath('2/3/4/5.dust', '2.dust'), '2/3/4/5.dust');
        })

    })
});