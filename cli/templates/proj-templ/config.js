'use strict';

var path = require('path');
exports.port = 3000;
exports.projectName = 'Bicycle Admin Site';
exports.elasticSearchHost = '127.0.0.1';
exports.elasticSearchPort = 9200;
exports.cryptoKey = 'k3yb0ardc4t';
exports.loginAttempts = {
    forIp: 50,
    forIpAndUser: 7,
    logExpiration: '20m'
};
exports.requireAccountVerification = false;
exports.oauth = {
    twitter: {
        key: process.env.TWITTER_OAUTH_KEY || '',
        secret: process.env.TWITTER_OAUTH_SECRET || ''
    },
    facebook: {
        key: process.env.FACEBOOK_OAUTH_KEY || '',
        secret: process.env.FACEBOOK_OAUTH_SECRET || ''
    },
    github: {
        key: process.env.GITHUB_OAUTH_KEY || '',
        secret: process.env.GITHUB_OAUTH_SECRET || ''
    },
    google: {
        key: process.env.GOOGLE_OAUTH_KEY || '',
        secret: process.env.GOOGLE_OAUTH_SECRET || ''
    },
    qq: {
        key: process.env.QQ_OAUTH_KEY || '',
        secret: process.env.QQ_OAUTH_SECRET || ''
    },
    weibo: {
        key: process.env.WEIBO_OAUTH_KEY || '',
        secret: process.env.WEIBO_OAUTH_SECRET || ''
    }
};
exports.db = {
    type: require('bicycle/db').backends.mongodb,
    opts: {
        uri: 'mongodb://localhost:27017/proj-templ',
        error: console.error.bind(console, 'mongodb connection error: ')
    }
};

exports.appName = 'proj-templ';
exports.viewsdir = path.join(__dirname, 'public/views');
exports.models = require('./models');

exports.logger = {
    "appenders": [
        {
            "type": "console",
            "layout": {
                "type": "colored"
            }
        },
        {
            "type": "file",
            "filename": path.join(__dirname, "/logs", exports.appName + ".log"),
            "pattern": "connector",
            "maxLogSize": 1048576,
            "layout": {
                "type": "basic"
            },
            "backups": 5,
            "category": exports.appName
        },
        {
            "type": "file",
            "filename": path.join(__dirname, "/logs", "bicycle-admin.log"),
            "pattern": "connector",
            "maxLogSize": 1048576,
            "layout": {
                "type": "basic"
            },
            "backups": 5,
            "category": 'bicycle-admin'
        },
        {
            "type": "file",
            "filename": path.join(__dirname, "/logs/bicycle.log"),
            "pattern": "connector",
            "maxLogSize": 1048576,
            "layout": {
                "type": "basic"
            },
            "backups": 5,
            "category": "bicycle"
        }
    ],

    "levels": {
        "bicycle": "DEBUG",
        "bicycle-admin": "DEBUG"
    },

    "replaceConsole": true,

    "lineDebug": true

}

exports.logger.levels[exports.appName] = 'DEBUG';
exports.version = '0.0.1';
