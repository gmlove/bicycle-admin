'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    mongoStore = require('connect-mongo')(express),
    http = require('http'),
    path = require('path'),
    helmet = require('helmet'),
    bicycle = require('bicycle'),
    db = require('bicycle/db'),
    webapi = require('./webapi'),
    api = require('./api'),
    bicycleAdmin = require('bicycle-admin');

//config bicycle apps
bicycle.use(require('bicycle-admin/config.js'));
bicycle.use(require('./config.js'));

//create express app
var app = express();
module.exports = app;

//setup the web server
app.server = http.createServer(app);
//setup the session store
app.sessionStore = new mongoStore({ url: config.db.opts.uri });

//init bicycle
bicycle.init(app);
app.bicycle = bicycle;

//init bicycle admin
bicycleAdmin.init(app);

var logger = require('bicycle/logger').getLogger('careco', __filename);

//config express in all environments
app.configure(function(){
    //settings
    app.disable('x-powered-by');
    app.set('port', config.port);
    app.set('strict routing', true);

    //middleware
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.favicon(__dirname + '/public/favicon.ico'));
    app.use('/public', express.static(path.join(__dirname, "public")));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(function(req, res, next) {
        //add support for get query cookie
        if(req.query['connect.sid']){
            req.headers['cookie'] = 'connect.sid=' + encodeURIComponent(req.query['connect.sid']);
            delete req.query['connect.sid'];
        }
        next();
    });
    app.use(express.cookieParser());
    app.use(express.session({
      secret: config.cryptoKey,
      store: app.sessionStore
    }));
    bicycleAdmin.setupMiddleware(app);
    helmet.defaults(app);

    //route requests
    webapi.init(app);
    bicycleAdmin.setupRoutes(app);
    app.use('/api/', api.routes());

    //error handler
    app.use(function(err, req, res, next) {
        if (req.path.indexOf('/webapi/') == 0) {
            return webapi.http500Handler(err, req, res, next);
        } else if (req.path.indexOf('/api/') == 0) {
            return api.http500Handler(err, req, res, next);
        }
    });

    app.get('/', function(req, res){
      res.redirect('/public/pages/index.html');
    });
});

//config express in dev environment
app.configure('development', function(){
    app.use(express.errorHandler());
});


//listen up
app.server.listen(config['port'], function(){
    //and... we're live
    logger.info('Server started at port: %s', config['port']);
});


process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ', err);
});
