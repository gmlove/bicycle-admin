'use strict';

var resp = require('./response');

function index (req, res) {
    resp.sendResult(0, {});
}


module.exports = {
    routes: require('./routes')
}