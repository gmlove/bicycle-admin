var BasePageSupport = require('./BasePageSupport');
var util = require('util');
var config = require('../../config');

function LoginPageSupport (workflow) {
    this.workflow = workflow;
}

util.inherits(LoginPageSupport, BasePageSupport);

var exp = module.exports = LoginPageSupport;
var proto = exp.prototype;

proto.forpage = "login.html";

proto.execute = function() {
    var workflow = this.workflow;
    workflow.outcome = {};
    workflow.emit('response');
}