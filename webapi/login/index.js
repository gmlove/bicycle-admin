'use strict';

var resp = require('../response');
var loginService = require('../../services/login');
var workflowFunc = require('bicycle/core/workflow');

var loginData = function (req, res) {
    resp.sendResult(0, {loginData: 'this is some fake login data.'}, res);
}

var login = function (req, res) {
    loginService.login(req, res, workflowFunc);
}

var loginWeb = function (req, res) {
    loginService.loginWeb(req, res, workflowFunc);
}

var forgot = function (req, res, next) {
    loginService.forgot(req, res, workflowFunc, next);
}

var resetData = function (req, res) {
    resp.sendResult(0, {email: req.query.email, token: req.query.token}, res);
}

var reset = function (req, res) {
    loginService.reset(req, res, workflowFunc);
}

var resetWeb = function (req, res) {
    loginService.resetWeb(req, res, workflowFunc);
}

var logout = function(req, res) {
    loginService.logout(req, res, workflowFunc);
}


var loginQQ = function(req, res) {
    loginService.loginQQ(req, res, workflowFunc);
}

var loginWeibo = function(req, res) {
    loginService.loginWeibo(req, res, workflowFunc);
}


exports.route = function(app) {
    app.get('/login/login/', loginData);
    app.post('/login/login/', login);
    app.post('/login/logout/', logout);
    app.post('/login/forgot/', forgot);
    app.get('/login/reset.json', resetData);
    app.post('/login/reset/:email/:token/', reset);
    app.post('/login/reset/', resetWeb);
    app.get('/login/login/qq/', loginQQ);
    app.get('/login/login/weibo/', loginWeibo);
}

