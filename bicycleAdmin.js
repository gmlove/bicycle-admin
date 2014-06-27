

var exp = module.exports;

var modelAdmins = exp.modelAdmins = {};

exp.registerAdmin = function (admin) {
    modelAdmins[admin.appName] = modelAdmins[admin.appName] || {};
    if(modelAdmins[admin.appName][admin.modelName]) {
        throw new Error('model has been registered: ' + admin.modelName);
    }
    modelAdmins[admin.appName][admin.modelName] = admin;
};

exp.unregisterAdmin = function (appName, modelName) {
    modelAdmins[appName] = modelAdmins[appName] || {};
    if(!modelAdmins[appName][modelName]) {
        throw new Error('model has been registered yet: ' + modelName);
    }
    modelAdmins[appName][modelName] = null;
};

exp.isModelRegistered = function (appName, modelName) {
    return modelAdmins[appName] && modelAdmins[appName][modelName];
}