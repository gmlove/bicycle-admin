'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    mongoStore = require('connect-mongo')(express),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    helmet = require('helmet'),
    bicycle = require('bicycle'),
    db = require('bicycle/db'),
    webapi = require('./webapi');

//config bicycle apps
bicycle.use(require('./config.js'));

//create express app
var app = express();

//setup the web server
app.server = http.createServer(app);

//init bicycle
bicycle.init(app);
app.bicycle = bicycle;

require('./index').init(app);

var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);

//config express in all environments
app.configure(function(){
    //settings
    app.disable('x-powered-by');
    app.set('port', config.port);
    app.set('strict routing', true);

/*
    app.set('project-name', config.projectName);
    app.set('company-name', config.companyName);
    app.set('system-email', config.systemEmail);
    app.set('crypto-key', config.cryptoKey);
    app.set('require-account-verification', config.requireAccountVerification);

    //smtp settings
    app.set('smtp-from-name', config.smtp.from.name);
    app.set('smtp-from-address', config.smtp.from.address);
    app.set('smtp-credentials', config.smtp.credentials);

    //twitter settings
    app.set('twitter-oauth-key', config.oauth.twitter.key);
    app.set('twitter-oauth-secret', config.oauth.twitter.secret);

    //github settings
    app.set('github-oauth-key', config.oauth.github.key);
    app.set('github-oauth-secret', config.oauth.github.secret);

    //facebook settings
    app.set('facebook-oauth-key', config.oauth.facebook.key);
    app.set('facebook-oauth-secret', config.oauth.facebook.secret);

    //google settings
    app.set('google-oauth-key', config.oauth.google.key);
    app.set('google-oauth-secret', config.oauth.google.secret);
*/

    //middleware
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.favicon(__dirname + '/public/favicon.png'));
    app.use('/public1', express.static(path.join(__dirname, "public1")));
    app.use('/public', express.static(path.join(__dirname, "public")));
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: config.cryptoKey,
      store: app.sessionStore
    }));
    require('./index').setupMiddleware(app);
    helmet.defaults(app);

    //route requests
    require('./index').setupRoutes(app);

    //error handler
    app.use(require('./webapi/http/index').http500Handler);
});

//config express in dev environment
app.configure('development', function(){
    app.use(express.errorHandler());
});

//setup passport
require('./services/passport')(app, passport);

app.use(express.errorHandler());


//listen up
app.server.listen(config['port'], function(){
    //and... we're live
    logger.info('Server started at port: %s', config['port']);
});

process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ', err);
});

module.exports = app;
