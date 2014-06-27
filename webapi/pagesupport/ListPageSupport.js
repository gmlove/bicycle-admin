var BasePageSupport = require('./BasePageSupport');
var util = require('util');
var apiAdmin = require('../admin');
var config = require('../../config');

function ListPageSupport (workflow) {
    BasePageSupport.call(this, workflow);
}

util.inherits(ListPageSupport, BasePageSupport);

var exp = module.exports = ListPageSupport;
var proto = exp.prototype;

proto.forpage = "list.html";

proto.getActiveMenu = function() {
    var modelRoute = this.req.query.model;
    if(modelRoute) {
        return modelRoute;
    }
}