'use strict';

var express = require('express');

var router = express.Router();

exports = module.exports = function(passport) {
    route(router, passport);
    return router;
};


function route(app, passport) {
}
