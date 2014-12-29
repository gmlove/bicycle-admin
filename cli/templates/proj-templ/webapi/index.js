'use strict';
var config = require('../config');
var path = require('path');
var fs = require('fs');
var logger = require('bicycle/logger').getLogger('proj-templ', __filename);

var exp = module.exports;


exp.routes = require('./routes');
exp.http500Handler = require('bicycle-admin/webapi/http/index').http500Handler;

var _initAdmin = function() {
    // modify BasePageSupport to change menu data
    var BasePageSupport = require('bicycle-admin/webapi/pagesupport/BasePageSupport');

    BasePageSupport.prototype.buildExtra = function(cb) {
        var menus = this.workflow.outcome.menu;
        // menus.push({
        //     "faClassName": "fa-group",
        //     "name": "test-menu",
        //     "children": [
        //         {
        //             "id": "test-submenu",
        //             "name": "test-submenu",
        //             "link": this.resolve('test.html'),
        //         },
        //     ]
        // });
        cb(null);
    }
}

exp.init = function (app) {
    _initAdmin();
    var adminPageSupport = require('bicycle-admin/webapi/pagesupport');
    adminPageSupport.registerPageSupport(require('./pagesupport/IndexPageSupport'));

    var admins = require('bicycle-admin/admins');
    var adminDir = path.join(__dirname, '../services/modeladmins');

    logger.debug('admindir: ', adminDir);

    fs.readdirSync(adminDir).forEach(function (filename) {
        if (!/\.js$/.test(filename) || !/Admin\.js$/.test(filename) || /index.js/.test(filename)) {
            return;
        }
        var name = path.basename(filename, '.js');
        var Admin = require(path.join(adminDir, name));
        logger.debug('register admin: ', name);
        admins.registerAdmin(new Admin());
    });

}
