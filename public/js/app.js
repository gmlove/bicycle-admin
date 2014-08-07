define('dustRender', ['jquery', 'utils', 'adminLTE'], function($, utils){
    window.bicycle.ready = false;
    $(function(){
        var base_path = window.bicycle.baseViewPath;
        var base_data_path = window.bicycle.baseDataPath;
        var path = window.location.pathname;
        path = path.replace(/\/$/, '/index.html');
        var data_path = path.match(/(^.*?).html/)[1];
        var template_path = data_path.replace(base_path, '') + '.dust';
        template_path = template_path[0] == '/' ? template_path.substring(1) : template_path;
        var data_path = base_data_path + '/' + template_path;
        data_path = data_path.substr(0, data_path.length - 5) + '.json';
        data_path = data_path[0] != '/' ? '/' + data_path : data_path;
        data_path = data_path.replace(/\/{2,}/g, '/');
        var http500_path = window.location.href.match(/(^https?:\/\/[^\/]*)\/.*$/)[1] +base_path + 'http/http500.html';

        $.get(data_path, utils.pageParsedUrl.params, function(data) {
            dust.isDebug = true;
            dust.debugLevel = 'INFO';
            window.viewData = data;
            dust.render(template_path, data, function(err, out) {
                if (err) {
                    console.log('render template failed: err=' + err.message + ', template=' + template_path + ', data=');
                    console.log(data);
                    console.log(err.stack);
                    throw err;
                }
                $('body').html(out);
                console.log('render complete!');
                window.bicycle.ready = true;
                $(document).trigger('bicycle.ready');
            });
        })
        .fail(function(err) {
            console.log('get data failed from path: ' + data_path);
            console.log(err);
            //window.location.href = http500_path;
        });
    });
});

requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: window.bicycle.relativeTo + '../js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        //app: '../app'
        jquery: '../bower_components/jquery/jquery',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        adminLTE: 'AdminLTE/app',
        k: "../vendor/kendo-ui/src/js",
    },
    shim: {
        jquery: {
            exports: '$',
        },
        bootstrap: {
            deps: ['jquery'],
            exports: "$.fn.popover",
        }
    },
    waitSeconds: 150
});

requirejs(['dustRender'],
function () {
    console.log('app started!');
});