var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var bicycle = require('bicycle').bicycle;

var exp = module.exports;

var modelAdmins = exp.modelAdmins = {};

exp.registerAdmin = function (admin) {
    logger.debug('register model admin: appName=%s, modelName=%s', admin.appName, admin.modelName);
    modelAdmins[admin.appName] = modelAdmins[admin.appName] || {};
    if(modelAdmins[admin.appName][admin.modelName]) {
        logger.warn('model has been registered: ' + admin.modelName);
    }
    modelAdmins[admin.appName][admin.modelName] = admin;
};

exp.isModelRegistered = function (appName, modelName) {
    return modelAdmins[appName] && modelAdmins[appName][modelName];
}


var config = require('./config');
var UserAdmin = require('./services/modeladmins/UserAdmin');
exp.registerAdmin(new UserAdmin(config.appName, 'User', bicycle.models[config.appName].User));
