var BasePageSupport = require('./BasePageSupport');
var util = require('util');
var config = require('../../config');
var appModels = require('bicycle').models;
var async = require('async');


function IndexPageSupport (workflow) {
    BasePageSupport.call(this, workflow);
}

util.inherits(IndexPageSupport, BasePageSupport);

var exp = module.exports = IndexPageSupport;
var proto = exp.prototype;

proto.forpage = "index.html";

proto.getModelsToStat = function() {
    var models = [
        {
            modelName: 'User',
            appName: config.appName,
            condition: {},
            description: "User Registrations",
            colorClassName: "bg-green",
            ionClassName: "ion-person-add"
        }
    ];
    return models;
}

proto.buildExtra = function(cb) {
    var page = this.workflow.outcome.page;
    var modelsToStat = this.getModelsToStat();
    if(!modelsToStat) {
        return cb(null);
    }

    page.content = page.content || {};
    var statBoxes = page.content.statBoxes = [];
    var self = this;

    var tasks = modelsToStat.map(function(m, i){
        return function(cb) {
            var dbmodel = appModels[m.appName][m.modelName];
            dbmodel.count(m.condition || {}, function(err, count){
                if(err) {
                    return cb(err);
                }
                statBoxes[i] = {
                    title: count,
                    description: m.description,
                    link: self.resolveModelUrl(m.appName, m.modelName),
                    colorClassName: m.colorClassName,
                    ionClassName: m.ionClassName,
                }
                cb(null);
            });
        }
    });

    async.parallel(tasks, function(err){
        if(err) {
            return cb(err);
        }
        cb(null);
    });
}