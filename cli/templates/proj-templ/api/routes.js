'use strict';

var express = require('express');
var consts = require('../consts.js');
var workflowFunc = require('bicycle/core/workflow')();

var router = express.Router();

exports = module.exports = function(passport) {
    route(router, passport);
    return router;
};


function route(app, passport) {
    function ensureAuthenticated(req, res, next) {
        var workflow = workflowFunc(req, res);
        if (req.isAuthenticated()) {
            return next();
        }
        workflow.outcome.errfor.code = consts.errorCode.unauthorized;
        return workflow.emit('response');
    }

    function ensureAdmin(req, res, next) {
      var workflow = workflowFunc(req, res);
      if (req.user.canPlayRoleOf('admin')) {
        return next();
      }
      workflow.outcome.errfor.code = consts.errorCode.unauthorized;
      return workflow.emit('response');
    }

    function ensureAccount(req, res, next) {
      var workflow = workflowFunc(req, res);
      if (req.user.canPlayRoleOf('account')) {
        if (req.app.get('require-account-verification')) {
          if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
            return res.redirect('/account/verification/');
          }
        }
        return next();
      }
      workflow.outcome.errfor.code = consts.errorCode.unauthorized;
      return workflow.emit('response');
    }

    app.all('/account/*', ensureAuthenticated);
    app.all('/account/*', ensureAccount);

    // require('./http').route(app);
    // require('./login').route(app);
}
