var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var async = require('async');
var dateFormat = require('dateformat');
var modelAdmins = require('../../admins').modelAdmins;
var apiAdmin = require('../admin');
var config = require('../../config');
var bicycle = require('bicycle');
var models = require('bicycle').models[config.appName];
var util = require('util');

var BasePageSupport = function (workflow) {
    this.workflow = workflow;
    this.req = workflow.req;
    this.res = workflow.res;
}

module.exports = BasePageSupport;
var proto = BasePageSupport.prototype;

proto.forpage = '';

proto.resolve = function(page) {
    return this.req.urlResolver.resolvePage(page);
}

proto.resolveModelUrl = function(appName, modelName) {
    return this.req.urlResolver.resolveModelListUrl(appName, modelName);
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

proto.buildMenuForApps = function() {
    var apps = Object.keys(bicycle.models);
    var self = this;
    var menus = [];
    apps.forEach(function(appName){
        if(appName === config.appName) {
            return;
        }
        var menu = {
            faClassName: "fa-group",
            name: self.toViewName(appName),
            children: [],
        };
        var models = bicycle.models[appName];
        Object.keys(models).forEach(function(modelName){
            menu.children.push({
                "id": apiAdmin.getRoutedModelName(appName, modelName),
                "name": self.toViewName(modelName, true),
                "link": self.resolveModelUrl(appName, modelName),
            });
        });
        menus.push(menu);
    });
    return menus;
}

proto.toViewName = function(name, addPlural) {
    var upperFirstLetter = function(str) {
        return str.charAt(0).toUpperCase() + str.substr(1);
    }
    var nameParts = name.split(/[-_]/);
    var words = [];
    for (var i = 0; i < nameParts.length; i++) {
        if(nameParts[i]) {
            words.push(upperFirstLetter(nameParts[i]));
        } else {

        }
    }
    var finalName = words.join(' ');
    finalName = finalName.replace(/([a-z][A-Z])/g, function(w){return w[0] + ' ' + w[1]});
    if(addPlural) {
        if(/[sx]$/.test(finalName)) {
            finalName = finalName + 'es';
        } else if(/ry$/.test(finalName)) {
            finalName = finalName.replace(/ry$/, 'ries');
        } else {
            finalName = finalName + 's';
        }
    }
    return finalName;
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
                    "id": apiAdmin.getRoutedModelName(config.appName, 'LoginAttempt'),
                    "name": "Login Attempts",
                    "link": this.resolveModelUrl(config.appName, 'LoginAttempt'),
                }
            ]
        }
    ];

    var appMenus = this.buildMenuForApps();
    appMenus.forEach(function(menu){
        menus.push(menu);
    });

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

proto.buildMessages = function(cb) {
    var msgs = this.req.session.messages;
    logger.debug('session message: %j', msgs);
    if(msgs && msgs.length) {
        this.workflow.outcome.page.messages = msgs;
        this.req.session.messages = [];
    }
    cb(null);
}

proto.buildExtra = function(cb) {
    cb(null);
}

proto.afterBuild = function(cb) {
    var menus = this.workflow.outcome.menu;
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
    cb(null);
}

proto.execute = function() {
    var workflow = this.workflow;
    async.waterfall([
        // function(cb) { // for test
        //     models.User.find({username:'root'}).limit(1).exec(function(err, users){
        //         workflow.req.user = users[0];
        //         cb(null);
        //     });
        // },
        this.buildHeader.bind(this),
        this.buildMenu.bind(this),
        this.buildContent.bind(this),
        this.buildMessages.bind(this),
        this.buildExtra.bind(this),
        this.afterBuild.bind(this),
    ], function(err) {
        if(err) {
            logger.error('error occurred: ', err);
            workflow.emit('500', err);
        } else {
            // logger.debug('page support result: %j', workflow.outcome);
            workflow.emit('response');
        }
    });
}