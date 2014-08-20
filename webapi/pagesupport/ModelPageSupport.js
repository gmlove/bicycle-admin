var BasePageSupport = require('./BasePageSupport');
var util = require('util');
var config = require('../../config');

function ModelPageSupport (workflow) {
    BasePageSupport.call(this, workflow);
}

util.inherits(ModelPageSupport, BasePageSupport);

var exp = module.exports = ModelPageSupport;
var proto = exp.prototype;

proto.forpage = "model.html";

proto.getActiveMenu = function() {
    var modelRoute = this.req.query.model;
    if(modelRoute) {
        return modelRoute;
    }
}