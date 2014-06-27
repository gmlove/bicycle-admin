var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);


var exp = module.exports;

var modelAdmins = exp.modelAdmins = {};

exp.registerAdmin = function (admin) {
    logger.debug('register model admin: appName=%s, modelName=%s', admin.appName, admin.modelName);
    modelAdmins[admin.appName] = modelAdmins[admin.appName] || {};
    if(modelAdmins[admin.appName][admin.modelName]) {
        throw new Error('model has been registered: ' + admin.modelName);
    }
    modelAdmins[admin.appName][admin.modelName] = admin;
};

exp.unregisterAdmin = function (appName, modelName) {
    logger.debug('unregister model admin: appName=%s, modelName=%s', admin.appName, admin.modelName);
    modelAdmins[appName] = modelAdmins[appName] || {};
    if(!modelAdmins[appName][modelName]) {
        throw new Error('model has been registered yet: ' + modelName);
    }
    modelAdmins[appName][modelName] = null;
};

exp.isModelRegistered = function (appName, modelName) {
    return modelAdmins[appName] && modelAdmins[appName][modelName];
}