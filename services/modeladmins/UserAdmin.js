var BaseAdmin = require('./BaseAdmin');
var util = require('util');

var UserAdmin = function (appName, modelName, model) {
    BaseAdmin.call(this, appName, modelName, model);
}

util.inherits(UserAdmin, BaseAdmin);


module.exports = UserAdmin;
var proto = UserAdmin.prototype;


proto.initHiddenColumns = function(model) {
    var columns = UserAdmin.super_.prototype.initHiddenColumns.call(this, model);
    var hiddenColumns = ['_id', 'password', 'resetPasswordToken', 'resetPasswordExpires',
        'avatar', 'roles.account'];
    hiddenColumns.forEach(function(c){
        columns.push(c);
    });
    return columns;
}