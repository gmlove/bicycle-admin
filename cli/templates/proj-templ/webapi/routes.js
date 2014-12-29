'use strict';

var express = require('express');

exports = module.exports = function(passport) {
    var app = express();
    app.use(app.router);
    route(app, passport);
    return app;
};


function route(app, passport) {
}
