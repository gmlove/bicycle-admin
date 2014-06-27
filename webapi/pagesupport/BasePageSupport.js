var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var async = require('async');
var dateFormat = require('dateformat');
var url = require('url');
var modelAdmins = require('../../admins').modelAdmins;
var apiAdmin = require('../admin');
var config = require('../../config');
var models = require('bicycle').models[config.appName];
var util = require('util');

var BasePageSupport = function (workflow) {
    this.workflow = workflow;
    this.req = workflow.req;
    this.res = workflow.res;
    this.pageBaseUrl = this.req.protocol + '://' + this.req.get('host') + '/public/pages/';
}

module.exports = BasePageSupport;
var proto = BasePageSupport.prototype;

proto.forpage = '';

proto.resolve = function(page) {
    return url.resolve(this.pageBaseUrl, page);
}

proto.resolveModelUrl = function(appName, modelName) {
    var routedName = apiAdmin.getRoutedModelName(appName, modelName);
    return this.resolve('list.html') + '?model=' + routedName;
}


proto.buildHeader = function(cb) {
    var req = this.workflow.req;
    var user = this.workflow.outcome.user = {
        name: req.user.username,
        avatar: req.user.avatar || '/public/img/avatar3.png',
        registerTime: dateFormat(req.user.timeCreated, 'yyyy.mm.dd'),
        lastLoginTime: null,
        role: 'Admininistrator',
    }
    models.LoginAttempt.find({user: req.user.username})
        .sort('-time')
        .limit(1)
        .exec(function(err, loginAttempt) {
            if(err) {
                return cb(err);
            }
            if(loginAttempt) {
                user.lastLoginTime = dateFormat(loginAttempt.time, 'mm.dd HH:MM:ss');
            } else {
                user.lastLoginTime = dateFormat(new Date(), 'mm.dd HH:MM:ss');
            }
            cb(null);
        });
}

proto.buildMenu = function(cb) {
    var menus = [
        {
            "faClassName": "fa-dashboard",
            "name": "Dashboard",
            "id": "Dashboard",
            "link": this.resolve("index.html"),
        },
        {
            "faClassName": "fa-group",
            "name": "Users & Auth",
            "children": [
                {
                    "id": apiAdmin.getRoutedModelName(config.appName, 'User'),
                    "name": "Users",
                    "link": this.resolveModelUrl(config.appName, 'User'),
                },
                {
                    "id": apiAdmin.getRoutedModelName(config.appName, 'Account'),
                    "name": "Accounts",
                    "link": this.resolveModelUrl(config.appName, 'Account'),
                },
                {
                    "id": apiAdmin.getRoutedModelName(config.appName, 'Admin'),
                    "name": "Admins",
                    "link": this.resolveModelUrl(config.appName, 'Admin'),
                },
                {
                    "id": apiAdmin.getRoutedModelName(config.appName, 'AdminGroup'),
                    "name": "Admin Groups",
                    "link": this.resolveModelUrl(config.appName, 'AdminGroup'),
                },
                {
                    "id": apiAdmin.getRoutedModelName(config.appName, 'loginAttempt'),
                    "name": "Login Attempts",
                    "link": this.resolveModelUrl(config.appName, 'LoginAttempt'),
                }
            ]
        }
    ];

    var activeMenu = this.getActiveMenu();
    activeMenu = activeMenu ? activeMenu : 'Dashboard';
    logger.debug('use activeMenu: ', activeMenu);
    fori:
    for (var i = 0; i < menus.length; i++) {
        var menu = menus[i];
        if(activeMenu == menu.id) {
            menu.active = true;
            break;
        }
        var children = menu.children;
        if(children) {
            for (var j = 0; j < children.length; j++) {
                var submenu = children[j];
                if(activeMenu == submenu.id) {
                    submenu.active = true;
                    menu.active = true;
                    break fori;
                }
            }
        }
    }

    this.workflow.outcome.menu = menus;
    cb(null);
}

proto.getActiveMenu = function() {
    return 'Dashboard';
}

proto.buildContent = function(cb) {
    var page = {
        title: 'Dashboard',
        description: '',
    };
    var breadcrumbItems = [{
        "link": this.resolve('index.html'),
        "faClassName": "fa-dashboard",
        "name": "Home"
    }];
    var addBreadcrumbItem = function(menus) {
        if(!menus) {
            return;
        }
        for (var i = 0; i < menus.length; i++) {
            var menu = menus[i];
            if(menu.active) {
                breadcrumbItems.push({
                    name: menu.name,
                    link: menu.link,
                });
                return addBreadcrumbItem(menu.children);
            }
        }
    }
    addBreadcrumbItem(this.workflow.outcome.menu);
    delete breadcrumbItems[breadcrumbItems.length-1].link;
    page.breadcrumb = breadcrumbItems;
    this.workflow.outcome.page = page;
    cb(null);
}

proto.buildExtra = function(cb) {
    cb(null);
}

proto.afterBuild = function(cb) {
    cb(null);
}

proto.execute = function() {
    var workflow = this.workflow;
    async.waterfall([
        function(cb) { // for test
            models.User.find({username:'root'}).limit(1).exec(function(err, users){
                workflow.req.user = users[0];
                cb(null);
            });
        },
        this.buildHeader.bind(this),
        this.buildMenu.bind(this),
        this.buildContent.bind(this),
        this.buildExtra.bind(this),
        this.afterBuild.bind(this),
    ], function(err) {
        if(err) {
            logger.error('error occurred: ', err);
            workflow.emit('500', err);
        } else {
            logger.debug('page support result: %j', workflow.outcome);
            workflow.emit('response');
        }
    });
}