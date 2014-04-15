'use strict';

var resp = require('../response');
var signupService = require('../../services/signup');

var signupData = function(req, res) {
    resp.sendResult({test:'test data'}, res);
}

var signup = function (req, res) {
    signupService.signup(req, res, require('../workflow')());
}


exports.route = function(app) {
    app.get('/signup/signup/', signupData);
    app.post('/signup/signup/', signup);
}

