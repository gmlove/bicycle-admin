$(document).ready(function(){
  var utils = {
    urlparams: function(url){
      var p = {};
      var idx = url.indexOf('?');
      if(idx == -1) return p;
      var purl = url.substr(idx + 1);
      var params = purl.split('&');
      for (var i = 0;i<params.length;i++){
        var eidx = params[i].indexOf('=');
        if (eidx == -1) p[params[i]] = '';
        else{
          p[params[i].substr(0, eidx)] = params[i].substr(eidx + 1);
        }
      }
      return p;
    }
  }

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
    });
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
    })
  };
  compile_in_order(0);
  $.get(data_path, function(data) {
    if(compiled) {
      render_tl(tl_paths[tl_paths.length-1], data);
    }
    data_data = data;
  });
});