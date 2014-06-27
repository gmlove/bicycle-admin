var BasePageSupport = require('./BasePageSupport');
var util = require('util');

function IndexPageSupport (workflow) {
    BasePageSupport.call(this, workflow);
}

util.inherits(IndexPageSupport, BasePageSupport);

var exp = module.exports = IndexPageSupport;
var proto = exp.prototype;

proto.forpage = "index.html";
