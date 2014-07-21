var BasePageSupport = require('./BasePageSupport');
var util = require('util');
var config = require('../../config');

function ResetpassPageSupport (workflow) {
    BasePageSupport.call(this, workflow);
}

util.inherits(ResetpassPageSupport, BasePageSupport);

var exp = module.exports = ResetpassPageSupport;
var proto = exp.prototype;

proto.forpage = "resetpass.html";

