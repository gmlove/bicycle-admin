var url = require('url');

function UrlResolver(req) {
    this.req = req;
    this.pageBaseUrl = this.req.protocol + '://' + this.req.get('host') + '/public/pages/';
}

module.exports = UrlResolver;
var proto = UrlResolver.prototype;

proto.resolvePage = function(page) {
    return url.resolve(this.pageBaseUrl, page);
}

proto.resolveModelListUrl = function(appName, modelName) {
    var apiAdmin = require('./admin');
    var routedName = apiAdmin.getRoutedModelName(appName, modelName);
    return this.resolvePage('list.html') + '?model=' + routedName;
}

proto._idFilter = function(_id) {
    var filter = {field: '_id', operator: "eq", value: _id };
    return '&' + 'filter=' + encodeURIComponent(JSON.stringify(filter));
}

proto.resolveModelUrl = function (appName, modelName, _id) {
    var url = this.resolveModelListUrl(appName, modelName);
    url += this._idFilter(_id);
    return url;
}

proto.resolveRefListUrl = function(refName) {
    var routedName = this.refToRoutedName(refName);
    return this.resolvePage('list.html') + '?model=' + routedName;
}

proto.resolveRefUrl = function (refName, _id) {
    var url = this.resolveRefListUrl(refName);
    url += this._idFilter(_id);
    return url;
}

proto.refToRoutedName = function(refName) {
    var routedName = refName.replace(/(_[A-Z])/, function(v){
        return '_' + v.toUpperCase();
    });
    return routedName;
}