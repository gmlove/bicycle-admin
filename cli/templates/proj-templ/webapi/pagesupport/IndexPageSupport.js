var util = require('util');
var config = require('../../config');
var appModels = require('bicycle').models;
var async = require('async');
var BaseIndexPageSupport = require('bicycle-admin/webapi/pagesupport/IndexPageSupport');
var adminConfig = require('bicycle-admin/config');

function IndexPageSupport (workflow) {
    BaseIndexPageSupport.call(this, workflow);
}

util.inherits(IndexPageSupport, BaseIndexPageSupport);

var exp = module.exports = IndexPageSupport;
var proto = exp.prototype;


proto.getModelsToStat = function() {
    var models = [
        {
            modelName: 'User',
            appName: adminConfig.appName,
            condition: {},
            description: "User Registrations",
            colorClassName: "bg-green",
            ionClassName: "ion-person-add"
        }
    ];
    models = IndexPageSupport.super_.prototype.getModelsToStat.call(this);
    var todayBegin = new Date();
    todayBegin.setHours(0, 0, 0, 0);
    models = models.concat([
        {
            modelName: 'User',
            appName: adminConfig.appName,
            condition: {timeCreated: {$gt: todayBegin}},
            description: "User Registrations Today",
            colorClassName: "bg-yellow",
            ionClassName: "ion-person-add"
        }
    ]);
    return models;
}

