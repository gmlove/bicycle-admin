define('dustRender', ['jquery', 'utils', 'adminLTE'], function($, utils){
    /* get parameters from query string */
    var params = utils.urlparams(window.location.href);
    var tl_paths = params['tl'].split(':');
    var data_path = params['data'];
    if (!tl_paths || !data_path) {
        console.log('no template or data to render found, will not render anything.');
        return;
    }

    /* ajax get and compile templates in order, get data to render, render the template. */
    var data_data = null, compiled = false;
    var render_tl = function(tl_path, data) {
        dust.render(tl_path, data, function(err, out) {
            if (err) {
                console.log('render template failed. err=' + err + ', template=' + tl_path);
                throw err;
            }
            $('body').html(out);
            console.log('render complete!');
            $(document).trigger('bicycle.ready');
        });
        console.log('rendering...');
    }
    var compile_tlpath = function(tl_path, next) {
        $.get(tl_path, function(data) {
            var tl_compiled = dust.compile(data, tl_path);
            console.log('compile template: ' + tl_path);
            dust.loadSource(tl_compiled);
            next();
        });
    };
    var compile_in_order = function(index) {
        compile_tlpath(tl_paths[index], function(err) {
            if(err) throw err;
            if(index < tl_paths.length - 1){
                /* call compile_in_order recursively. */
                compile_in_order(index + 1);  
            } else {
                compiled = true;
                if(data_data) {
                  render_tl(tl_paths[tl_paths.length-1], data_data);
                }
            }
        });
    };
    compile_in_order(0);
    $.get(data_path, function(data) {
        if(compiled) {
            render_tl(tl_paths[tl_paths.length-1], data);
        }
        data_data = data;
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
});

requirejs(['dustRender'],
function () {
    console.log('app started!');
});