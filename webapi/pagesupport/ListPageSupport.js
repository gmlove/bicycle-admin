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

proto.buildContent = function(cb) {
    var self = this;
    ListPageSupport.super_.prototype.buildContent.call(this, function(err){
        if(err) {
            return cb(err);
        }
        var menus = self.workflow.outcome.menu;
        for (var i = 0; i < menus.length; i++) {
            if(menus[i].children) {
                for (var j = 0; j < menus[i].children.length; j++) {
                    var menu = menus[i].children[j];
                    if(menu.id == self.req.query.model) {
                        self.workflow.outcome.page.title = menu.name;
                        return cb(null);
                    }
                };
            }
        }
        cb(null);
    });
}