define('model', ['jquery','utils', 'k/kendo.web', 'k/kendo.timezones'],
function ($, utils) {

var modelName = utils.pageParsedUrl.params['model'].replace(/_[a-zA-Z]/g, function(word){return word.substring(1,2).toUpperCase();});
var modelData = null;
var fieldTemplate = kendo.template(
'\
# if (title !== "") {#\
<h4>#=title #</h4>\
# } #\
# if (type == "grid") {#\
<div class="form-group">\
    <div id="#=id #"></div>\
</div>\
# } else { #\
# for (var i = 0; i < columns.length; i++) { #\
<div class="form-group">\
    <label>#=columns[i].title # # if (columns[i].required) {# * #} #\</label>\
    # if (columns[i].type != "select") {#\
    <input class="form-control" data-bind="#=columns[i].field #"\
    # if (columns[i].required) {# required #} #\
    />\
    #}else{#\
    <select data-bind="" />\
    #}#\
</div>\
# } #\
# } #\
');

('<li>\
    <label data-bind="attr: { for: name}, text: label"></label>\
     # if (get("type") != "select") {#\
    <input data-bind="attr: { type: type, name: name, class: css}" # if (get("required")) {# required #} # />\
    #}else{#\
    <select data-bind="source: options, textField=ddltext;, valueField=ddlvalue;" />\
    #}#\
</li>'
);

var supportiveData = function(data) {
    data.get = function(name) {
        return this[name] ? this[name] : "";
    }
    return data;
}

$.get('../data/models/' + modelName + '.json', function(data) {
    modelData = data;
    var fieldsHtml = [];
    for (var i = 0; i < data.form.groups.length; i++) {
        fieldsHtml.push(fieldTemplate(supportiveData(data.form.groups[i])));
    };
    var container = $('#model-form>form>div');
    container.html(fieldsHtml.join(''));
    var modelConf = data.form.dataSource.schema.model;
    var viewModel = kendo.observable(modelConf);
    kendo.bind(container, viewModel);
});


});

//@ sourceURL=model.js