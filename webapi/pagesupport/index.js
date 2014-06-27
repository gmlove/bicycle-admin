var fs = require('fs');
var path = require('path');
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var workflowFunc = require('bicycle/core/workflow');
var express = require('express');

var exp = module.exports;
var pagesupportCls = {};

fs.readdirSync(__dirname).forEach(function (filename) {
    if (/index\.js$/.test(filename)) {
        return;
    }
    var name = path.basename(filename, '.js');
    var PageSupport = require('./' + name);
    if(PageSupport.prototype.forpage) {
        pagesupportCls[PageSupport.prototype.forpage] = PageSupport;
    }
});


exports.pagesupportRoute = function(adminApp) {
    var app = express();
    app.use(app.router);
    Object.keys(pagesupportCls).forEach(function(pageName){
        var path = pageName.replace(/^(.*)\.([^.]+)$/, '/$1.json');
        logger.debug('add pagesupport route for path: ', path);
        app.get(path, function(req, res){
            logger.debug('pagesupport request: originalUrl=%s, query=%j, params=%j, body=%j',
                req.originalUrl, req.query, req.params, req.body);
            var workflow = workflowFunc(req, res);
            new pagesupportCls[pageName](workflow).execute();
        });
    });
    return app;
}

exports.route = function(app) {
    app.use('/pagesupport', exports.pagesupportRoute(app));
}