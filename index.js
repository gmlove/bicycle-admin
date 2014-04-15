'use strict';

var passport = require('passport'),
    mongoose = require('mongoose'),
    webapi = require('./webapi');


exports.config = require('./config.js');

exports.setupMiddleware = function(app) {
    app.use(passport.initialize());
    app.use(passport.session());
    //setup passport
    require('./services/passport')(app, passport);
}


exports.setupRoutes = function(app, passport) {
    app.use('/webapi/', webapi.routes());
}


exports.errorHandler = require('./webapi/http/index').http500Handler;
