'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    morgan = require('morgan'),
    compression = require('compression'),
    favicon = require('serve-favicon'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    serveStatic = require('serve-static'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    errorhandler = require('errorHandler'),
    mongoStore = require('connect-mongo')(session),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    helmet = require('helmet'),
    bicycle = require('bicycle'),
    db = require('bicycle/db'),
    webapi = require('./webapi'),
    api = require('./api'),
    bicycleAdmin = require('bicycle-admin');

var env = process.env.NODE_ENV || 'development';

//config bicycle apps
bicycle.use(require('bicycle-admin/config.js'));
bicycle.use(require('./config.js'));

//create express app
var app = express();

//setup the web server
app.server = http.createServer(app);
//setup the session store
app.sessionStore = new mongoStore({ url: config.db.opts.uri });

//init bicycle
bicycle.init(app);
app.bicycle = bicycle;

//init bicycle admin
bicycleAdmin.init(app);

var logger = require('bicycle/logger').getLogger(config.appName, __filename);

//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('strict routing', true);

//middleware
if ('development' == env) {
    app.use(morgan('dev'));
}
app.use(compression());
app.use(favicon(__dirname + '/public/favicon.png'));
app.use('/public1', serveStatic(path.join(__dirname, "public1")));
app.use('/public', serveStatic(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.cryptoKey,
    store: app.sessionStore
}));
bicycleAdmin.setupMiddleware(app);
app.use(helmet());

//route requests
webapi.init(app);
bicycleAdmin.setupRoutes(app);
app.use('/api/', api.routes());

app.get('/', function(req, res){
  res.redirect('/public/pages/login.html');
});

//error handler
app.use(function(err, req, res, next) {
    if (req.path.indexOf('/webapi/') == 0) {
        return webapi.http500Handler(err, req, res, next);
    } else if (req.path.indexOf('/api/') == 0) {
        return api.http500Handler(err, req, res, next);
    }
});

app.use(errorhandler());

//setup passport
require('bicycle-admin/services/passport')(app, passport);

//listen up
app.server.listen(config['port'], function(){
    //and... we're live
    logger.info('Server started at port: %s', config['port']);
});


process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ', err);
});


module.exports = app;
