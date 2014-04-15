'use strict';

var response = require('../../services/response.js');
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);

exports.http404 = function(req, res){
    response.sendResult(0, {path: req.session.err404}, res);
};

exports.http500 = function(req, res){
    var err = req.session.err500 || {message: 'Unknown'};
    if (req.app.get('env') === 'development') {
        logger.info('Error: ', err);
        response.sendResult(0, err, res);
    } else {
        response.sendResult(0, {message: err.message}, res);
    }
};


exports.http500Handler = function(err, req, res, next) {
    logger.warn('error occured: ', err);
    if(!req.session) {
        response.sendResult(500, {}, res);
        return;
    }
    req.session.err500 = {message: err.message};
    if (req.app.get('env') === 'development') {
        req.session.err500.stack = err.stack;
    }
    response.sendResult(500, {}, res);
}



exports.route = function(app) {
    app.get('/http/:code.json', function(req, res) {
        return exports[req.params.code](req, res);
    });
}

