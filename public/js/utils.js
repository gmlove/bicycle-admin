define('utils', function(require, exports, module){

var exp = exports;

exp.parseUrl = function(url) {
    var parsed = {
        anchor: '',
        port: -1,
        host: null,
        params: {},
        schema: null,
    };
    if(/#[^?&]*$/.test(url)) {
        parsed.anchor = url.match(/#([^?&]*)$/)[0];
    }
    parsed.params = exp.urlparams(url.substring(0, url.length - parsed.anchor.length));
    var idx = url.indexOf('?');
    if(idx != -1) {
        url = url.substring(0, idx);
    }
    var matches = url.match(/^(http[s]?):\/\/([^:\/]+):?([0-9]*)\/(.*)$/);
    parsed.schema = matches[1];
    parsed.host = matches[2];
    parsed.port = matches[3] ? parseInt(matches[3]) : 80;
    parsed.path = matches[4];
    // console.log(parsed);
    return parsed;
}

exp.relativeUrl = function(urlto, path, params) {
    if(urlto.indexOf('?') != -1) {
        urlto = urlto.replace(/\?.*$/, '');
    }
    if(urlto.indexOf('/') == -1) {
        urlto = urlto + '/';
    }
    var url = urlto.replace(/\/[^\/]*$/, '/') + path;
    if(params) {
        var urlparams = [];
        for(var i in params) {
            urlparams.push(i + '=' + encodeURIComponent(params[i]));
        }
        url += '?' + urlparams.join('&');
    }
    return url;
}

exp.urlparams = function(url){
    var p = {};
    var idx = url.indexOf('?');
    if(idx == -1) return p;
    var purl = url.substr(idx + 1);
    var params = purl.split('&');
    for (var i = 0;i<params.length;i++){
        var eidx = params[i].indexOf('=');
        if (eidx == -1) p[params[i]] = '';
        else{
            p[params[i].substr(0, eidx)] = decodeURIComponent(params[i].substr(eidx + 1));
        }
    }
    return p;
}

exp.pageParsedUrl = exp.parseUrl(window.location.href);

});