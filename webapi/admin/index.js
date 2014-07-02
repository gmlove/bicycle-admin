var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var admins = require('../../admins');
var express = require('express');
var util = require('util');
var bicycle = require('bicycle').bicycle;
var workflowFunc = bicycle.core.workflowFunc;

var _constructModelRoute = function(modelAdmin) {
    var app = express();
    var routes = modelAdmin.routes();
    Object.keys(routes).forEach(function(method) {
        var methodRoutes = routes[method];
        methodRoutes.forEach(function(routeConf) {
            if(!app[method]) {
                throw new Error('no such http method: ' + method);
            }
            app[method](routeConf.url, function(req, res) {
                logger.debug('request: originalUrl=%s, params=%j, query=%j, body=%j',
                    req.originalUrl, req.params, req.query, req.body);
                routeConf.handler.call(modelAdmin, workflowFunc(req, res));
            });
            logger.debug('add model route: method=%s, url=%s', method, routeConf.url);
        });
    });
    return app;
}

exports.getRoutedModelName = function(appName, modelName) {
    return [appName, modelName].join('__').replace('-', '_');
}

exports.adminRoute = function(adminApp) {
    var BaseAdmin = require('../../services/modeladmins/BaseAdmin');
    var app = express();
    var models = bicycle.models;
    Object.keys(models).forEach(function(appName) {
        var appModels = models[appName];
        Object.keys(appModels).forEach(function(modelName) {
            if(!admins.isModelRegistered(appName, modelName)) {
                var admin = new BaseAdmin(appName, modelName, appModels[modelName]);
                admins.registerAdmin(admin);
            }
        });
    });
    Object.keys(admins.modelAdmins).forEach(function(appName) {
        var appModelAdmins = admins.modelAdmins[appName];
        Object.keys(appModelAdmins).forEach(function(modelName) {
            var modelRouteName = exports.getRoutedModelName(appName, modelName);
            logger.debug('add routes for model: appName=%s, modelName=%s', appName, modelName);
            app.use('/' + modelRouteName, _constructModelRoute(appModelAdmins[modelName]));
        });
    });
    return app;
}

exports.route = function(app) {
    app.use('/admin', exports.adminRoute(app));
}
