'use strict';

module.exports = {
    routes: require('./routes'),
    http500Handler: require('bicycle-admin/webapi/http/index').http500Handler
}