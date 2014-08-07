define('model', ['jquery','utils', 'base', 'k/kendo.web', 'k/kendo.timezones'],
function ($, utils) {

var modelName = utils.pageParsedUrl.params['model'];
var modelId = utils.pageParsedUrl.params['_id'] || '000000000000000000000000';
var createMode = modelId === '000000000000000000000000';
var modelConf = null;
var modelData = null;
var modelDataSource = null;
var modelEditable = null;
var FUNCTION = "function";
var STRING = "string";
var isPlainObject = $.isPlainObject,
    extend = $.extend,
    map = $.map,
    grep = $.grep,
    isArray = $.isArray,
    inArray = $.inArray,
    push = Array.prototype.push,
    proxy = $.proxy,
    isFunction = kendo.isFunction,
    isEmptyObject = $.isEmptyObject,
    COMMANDBUTTONTMPL = '<a class="k-button k-button-icontext #=className#" #=attr# href="\\#"><span class="#=iconClass# #=imageClass#"></span>#=text#</a>';
var defaultCommands = {
    create: {
        text: "Add new record",
        imageClass: "k-add",
        className: "k-edit-add",
        iconClass: "k-icon"
    },
    createStay: {
        text: "Add new record and continue",
        imageClass: "k-add",
        className: "k-edit-add-stay",
        iconClass: "k-icon"
    },
    cancel: {
        text: "Cancel changes",
        imageClass: "k-cancel",
        className: "k-edit-cancel-changes",
        iconClass: "k-icon"
    },
    save: {
        text: "Save changes",
        imageClass: "k-update",
        className: "k-edit-save-changes",
        iconClass: "k-icon"
    },
    saveStay: {
        text: "Save changes and continue",
        imageClass: "k-update",
        className: "k-edit-save-changes-stay",
        iconClass: "k-icon"
    },
    destroy: {
        text: "Delete",
        imageClass: "k-delete",
        className: "k-edit-delete",
        iconClass: "k-icon"
    },
    edit: {
        text: "Edit",
        imageClass: "k-edit",
        className: "k-edit-edit",
        iconClass: "k-icon"
    },
    update: {
        text: "Update",
        imageClass: "k-update",
        className: "k-edit-update",
        iconClass: "k-icon"
    },
    updateStay: {
        text: "Update and continue",
        imageClass: "k-update",
        className: "k-edit-update-stay",
        iconClass: "k-icon"
    },
    canceledit: {
        text: "Cancel",
        imageClass: "k-cancel",
        className: "k-edit-cancel",
        iconClass: "k-icon"
    }
};


var supportiveData = function(data) {
    data.get = function(name) {
        return this[name] ? this[name] : "";
    }
    return data;
}

var modelDisplayName = modelName.replace(/^.*__/, '').replace(/([^A-Z])([A-Z])/g, '$1 $2');
if(createMode) {
    $('#model-title').text('Create ' + modelDisplayName);
} else {
    $('#model-title').text('Change ' + modelDisplayName + ' ' + modelId);
}


$.get('../../webapi/admin/' + modelName + '/config/', function(data) {
    modelConf = data.grid.gridConf;
    var $form = $('#model-form');
    modelConf.dataSource.filter = {field: '_id', operator: "eq", value: modelId };
    modelDataSource = new kendo.data.DataSource(modelConf.dataSource);
    if(createMode) {
        modelDataSource.pushCreate({});
    }
    console.log(modelConf.dataSource);
    if(!createMode) {
        modelDataSource.fetch(function(){
            var view = modelDataSource.view();
            if(!view.length) {
                var modelNotExistHtml = '\
                <div class="alert alert-danger alert-dismissable">\
                    <i class="fa fa-ban"></i>\
                    <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>\
                    <b>Model does not exist!</b>\
                </div>';


                $form.find('.box-body').append($(modelNotExistHtml));
                console.log('model not exist: ' + modelId);
                return;
            }
            modelData = view[0];
            renderModel(modelData);
        });
    } else {
        modelData= modelDataSource.at(0);
        renderModel(modelData);
    }
});

function getCommand(commands, name) {
   var idx, length, command;

   if (typeof commands === STRING && commands === name) {
      return commands;
   }

   if (isPlainObject(commands) && commands.name === name) {
       return commands;
   }

   if (isArray(commands)) {
       for (idx = 0, length = commands.length; idx < length; idx++) {
           command = commands[idx];

           if ((typeof command === STRING && command === name) || (command.name === name)) {
               return command;
           }
       }
   }
   return null;
}

var _cellTmpl = function(column, state) {
    var settings = extend({}, kendo.Template, modelConf.templateSettings),
        template = column.template,
        paramName = settings.paramName,
        field = column.field,
        html = "",
        idx,
        length,
        format = column.format,
        type = typeof template,
        columnValues = column.values;

    if (column.command) {
        if (isArray(column.command)) {
            for (idx = 0, length = column.command.length; idx < length; idx++) {
                html += _createButton(column.command[idx]);
            }
            return html.replace(templateHashRegExp, "\\#");
        }
        return _createButton(column.command).replace(templateHashRegExp, "\\#");
    }
    if (type === FUNCTION) {
        state.storage["tmpl" + state.count] = template;
        html += "#=this.tmpl" + state.count + "(" + paramName + ")#";
        state.count ++;
    } else if (type === STRING) {
        html += template;
    } else if (columnValues && columnValues.length && isPlainObject(columnValues[0]) && "value" in columnValues[0] && field) {
        html += "#var v =" + kendo.stringify(convertToObject(columnValues)) + "#";
        html += "#var f = v[";

        if (!settings.useWithBlock) {
            html += paramName + ".";
        }

        html += field + "]#";
        html += "${f != null ? f : ''}";
    } else {
        html += column.encoded ? "#:" : "#=";

        if (format) {
            html += 'kendo.format(\"' + format.replace(formatRegExp,"\\$1") + '\",';
        }

        if (field) {
            field = kendo.expr(field, paramName);
            html += field + "==null?'':" + field;
        } else {
            html += "''";
        }

        if (format) {
            html += ")";
        }

        html += "#";
    }
    return html;
};

var _createButton = function(command) {
    var template = command.template || COMMANDBUTTONTMPL,
        commandName = typeof command === STRING ? command : command.name || command.text,
        className = defaultCommands[commandName] ? defaultCommands[commandName].className : "k-grid-" + (commandName || "").replace(/\s/g, ""),
        options = { className: className, text: commandName, imageClass: "", attr: "", iconClass: "" };

    if (!commandName && !(isPlainObject(command) && command.template))  {
        throw new Error("Custom commands should have name specified");
    }

    if (isPlainObject(command)) {
        if (command.className) {
            command.className += " " + options.className;
        }

        if (commandName === "edit" && isPlainObject(command.text)) {
            command = extend(true, {}, command);
            command.text = command.text.edit;
        }

        if (command.attr && isPlainObject(command.attr)) {
            command.attr = stringifyAttributes(command.attr);
        }

        options = extend(true, options, defaultCommands[commandName], command);
    } else {
        options = extend(true, options, defaultCommands[commandName]);
    }

    return kendo.template(template)(options);
};

function stringifyAttributes(attributes) {
    var attr,
        result = " ";

    if (attributes) {
        if (typeof attributes === STRING) {
            return attributes;
        }

        for (attr in attributes) {
            result += attr + '="' + attributes[attr] + '"';
        }
    }
    return result;
};

function renderModel(model) {
    // TODO: display the model data.
    var $formBody = $('#model-form').find('.box-body');
    var $formFooter = $('#model-form').find('.box-footer');
    var columns = modelConf.columns;
    var html = html = '<div ' + kendo.attr("uid") + '="' + model.uid + '" class="k-edit-form"><div class="k-edit-form-container">';
    var editable = modelConf.editable;
    var template = editable.template;
    var options = isPlainObject(editable) ? editable.window : {};
    var settings = extend({}, kendo.Template, modelConf.templateSettings);
    var idx = 0, length = 0, tempCommand = null, command = null, fields = [],
        tmpl, updateText, updateStayText, createText, createStayText, destroyText, cancelText, attr;
    if (template) {
        if (typeof template === STRING) {
            template = window.unescape(template);
        }

        html += (kendo.template(template, settings))(model);

        for (idx = 0, length = columns.length; idx < length; idx++) {
            column = columns[idx];
            if (column.command) {
                tempCommand = getCommand(column.command, "edit");
                if (tempCommand) {
                    command = tempCommand;
                }
            }
        }
    } else {
        for (idx = 0, length = columns.length; idx < length; idx++) {
            var column = columns[idx];

            if (!column.command) {
                html += '<div class="k-edit-label"><label for="' + column.field + '">' + (column.title || column.field || "") + '</label></div>';

                if ((!model.editable || model.editable(column.field)) && column.field) {
                    fields.push({ field: column.field, format: column.format, editor: column.editor, values: column.values });
                    html += '<div ' + kendo.attr("container-for") + '="' + column.field + '" class="k-edit-field"></div>';
                } else {
                    var state = { storage: {}, count: 0 };

                    tmpl = kendo.template(_cellTmpl(column, state), settings);

                    if (state.count > 0) {
                        tmpl = proxy(tmpl, state.storage);
                    }

                    html += '<div class="k-edit-field">' + tmpl(model) + '</div>';
                }
            } else if (column.command) {
                tempCommand = getCommand(column.command, "edit");
                if (tempCommand) {
                    command = tempCommand;
                }
            }
        }
    }

    if (command) {
        if (isPlainObject(command)) {
           if (command.text && isPlainObject(command.text)) {
               updateText = command.text.update;
               updateStayText = command.text.updateStay;
               cancelText = command.text.cancel;
               createText = command.text.create;
               createStayText = command.text.createStay;
               destroyText = command.text.destroyText;
           }

           if (command.attr) {
               attr = command.attr;
           }
        }
    }

    var container;
    html += '<div class="k-edit-buttons k-state-default">';
    if(createMode) {
        html += _createButton({ name: "create", text: createText, attr: attr });
        html += _createButton({ name: "createStay", text: createStayText, attr: attr });
    } else {
        html += _createButton({ name: "update", text: updateText, attr: attr });
        html += _createButton({ name: "updateStay", text: updateStayText, attr: attr });
    }
    html += _createButton({ name: "canceledit", text: cancelText, attr: attr });
    if(!createMode) {
        html += _createButton({ name: "destroy", text: destroyText, attr: attr });
    }
    html += '</div></div></div>';

    container = $(html).appendTo($formBody);
    modelEditable = container
        .kendoEditable({
            fields: fields,
            model: model,
            clearContainer: false
        }).data("kendoEditable");

    function addLoadingMask() {
        $('<div class="k-loading-mask" style="width: 100%; height: 100%; top: 0px; left: 0px;">\
            <span class="k-loading-text">Loading...</span><div class="k-loading-image"></div>\
            <div class="k-loading-color"></div>\
          </div>').appendTo($formBody);
    }

    function removeLoadingMask() {
        $formBody.find('.k-loading-mask').remove();
    }

    function wrapEventHandler(validate, func) {
        if(typeof validate === FUNCTION) {
            func = validate;
            validate = false;
        }
        return function() {
            if(validate) {
                if(!modelEditable.validatable.validate()) {
                    alert('Please fix the invalid data.');
                    return;
                }
            }
            addLoadingMask();
            var args = Array.prototype.slice.call(arguments, 0);
            args.push(removeLoadingMask);
            func.apply(null, args);
            setTimeout(removeLoadingMask, 2000);
        }
    }

    var listPageUrl = utils.relativeUrl(window.location.href, 'list.html', {model: modelName});

    var onModelChange = function(done, redirectPageFunc) {
        var response = null;
        modelDataSource.one("requestEnd", function(obj) {
            console.log('requestEnd: ', arguments);
            response = obj.response;
        });
        modelDataSource.one("change", function(e) {
            console.log("Changes has been synced: %j", modelData);
            done();
            if(response.success === false || !modelData._id) {
                if(response.errors) {
                    alert('Operation failed: ' + response.errors[0]);
                } else {
                    alert('Operation failed!');
                }
            } else {
                var redirectPage = redirectPageFunc();
                window.location.href = redirectPage;
            }
        });
        modelDataSource.sync();
    }

    container.on('click.k-edit-form', '.k-edit-add', wrapEventHandler(true, function(e, done){
        console.log('add button clicked');
        onModelChange(done, function(){
            return listPageUrl;
        });
    }));
    container.on('click.k-edit-form', '.k-edit-add-stay', wrapEventHandler(true, function(e, done){
        console.log('add stay button clicked');
        onModelChange(done, function(){
            return utils.relativeUrl(window.location.href, 'model.html', {model: modelName, _id: modelData.get('_id')});
        });
    }));

    container.on('click.k-edit-form', '.k-edit-update', wrapEventHandler(true, function(e, done){
        console.log('update button clicked');
         onModelChange(done, function(){
            return listPageUrl;
        });
    }));
    container.on('click.k-edit-form', '.k-edit-update-stay', wrapEventHandler(true, function(e, done){
        console.log('update stay button clicked');
        onModelChange(done, function(){
            return utils.relativeUrl(window.location.href, 'model.html', {model: modelName, _id: modelData.get('_id')});
        });
    }));

    container.on('click.k-edit-form', '.k-edit-cancel', wrapEventHandler(function(e, done){
        console.log('cancel button clicked');
        window.location.reload();
    }));

    container.on('click.k-edit-form', '.k-edit-delete', wrapEventHandler(function(e, done){
        console.log('destroy button clicked');
        if(!window.confirm('Do you really want to delete this object?')) {
            return;
        }
        modelDataSource.remove(modelData);
        onModelChange(done, function(){
            return listPageUrl;
        });
    }));


    console.log('render model: ', model);
}

// $.get('../data/models/' + modelName + '.json', function(data) {
//     modelData = data;
//     var fieldsHtml = [];
//     for (var i = 0; i < data.form.groups.length; i++) {
//         fieldsHtml.push(fieldTemplate(supportiveData(data.form.groups[i])));
//     };
//     var container = $('#model-form>form>div');
//     container.html(fieldsHtml.join(''));
//     var modelConf = data.form.dataSource.schema.model;
//     var viewModel = kendo.observable(modelConf);
//     kendo.bind(container, viewModel);
// });


});

//@ sourceURL=model.js