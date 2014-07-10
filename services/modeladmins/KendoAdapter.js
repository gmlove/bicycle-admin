var mongoose = require('bicycle/db').mongoose;
var util = require('util');
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var dateFormat = require('dateFormat');

function KendoAdapter() {
}

var exp = module.exports = KendoAdapter;
var proto = KendoAdapter.prototype;
var kendoFieldSep = proto.kendoFieldSep = '___';
proto.kendoFieldNameForArray = '___index';
proto.kendoColumnNameForArray = '___index';

proto.toKendoFieldName = function(attrName) {
    return attrName.replace(/\./g, kendoFieldSep);
}

proto.toDbFieldName = function(kendoFieldName) {
    return kendoFieldName.replace(kendoFieldSep, '.');
}

proto.updateModelForSimpleArray = function(kendoSchema, attr, kendoModels, instance, path, create) {
    var data = instance.get(path);
    if(!data) {
        if(!create && kendoModels.length) {
            throw new Error('no model found for update');
        }
        data = instance[path] = [];
    }
    var self = this;
    var updated = [];
    var kendoFieldName = Object.keys(kendoSchema.fields).filter(function(fieldName){
        return fieldName !== self.kendoFieldNameForArray;
    })[0];
    for (var i = 0; i < kendoModels.length; i++) {
        var kendoModel = kendoModels[i];
        if(kendoModel[kendoFieldName] && kendoSchema.fields[kendoFieldName].type == "date") {
            kendoModel[kendoFieldName] = new Date(kendoModel[kendoFieldName]);
        }
        if(create) {
            data.push(kendoModel[kendoFieldName]);
            updated.push(self.toKendoModel(kendoSchema, data[data.length-1], data.length-1));
        } else {
            var index = parseInt(kendoModel[self.kendoFieldNameForArray]) - 1;
            if(!data[index]) {
                throw new Error('no model found for update');
            } else {
                data[index] = kendoModel[kendoFieldName];
                updated.push(self.toKendoModel(kendoSchema, data[index], index));
            }
        }
    }
    return updated;
}

proto.updateModelForDocArray = function(kendoSchema, schema, kendoModels, instance, path, create) {
    var data = instance.get(path);
    if(!data) {
        if(!create && kendoModels.length) {
            throw new Error('no model found for update');
        }
        data = instance[path] = [];
    }
    var self = this;
    var updated = [];
    for (var i = 0; i < kendoModels.length; i++) {
        var kendoModel = kendoModels[i];
        var obj = null;
        if(create) {
            var instancePart = instance[path].create({});
            self.updateModel(kendoSchema, schema, kendoModel, instancePart, data.length + i, true);
            data.push(instancePart);
            updated.push(self.toKendoModel(kendoSchema, data[data.length-1], data.length-1));
        } else {
            var index = parseInt(kendoModel[self.kendoFieldNameForArray]) - 1;
            if(!data[index]) {
                throw new Error('no model found for update');
            } else {
                self.updateModel(kendoSchema, schema, kendoModel, data[index], index, true);
                updated.push(self.toKendoModel(kendoSchema, data[index], index));
            }
        }
    }
    return updated;
}

proto._updateModelField = function(kendoSchema, schema, kendoModel, instance, index, create, kendoFieldName) {
    if(kendoFieldName === this.kendoFieldNameForArray && index !== undefined && index !== null) {
        return;
    }
    var attrName = this.toDbFieldName(kendoFieldName);
    var attr = schema.paths[attrName];
    var schemaTypes = mongoose.Schema.Types;
    if(kendoModel[kendoFieldName] && kendoSchema.fields[kendoFieldName].type == "date") {
        kendoModel[kendoFieldName] = new Date(kendoModel[kendoFieldName]);
    }
    if(create && kendoFieldName == '_id') {
        return;
    }
    if(attr instanceof schemaTypes.ObjectId && !kendoModel[kendoFieldName]) {
        instance.set(attrName, null);
    } else {
        instance.set(attrName, kendoModel[kendoFieldName]);
    }
}

proto.updateModel = function(kendoSchema, schema, kendoModel, instance, index, create) {
    var self = this;
    var schemaTypes = mongoose.Schema.Types;

    Object.keys(kendoSchema.fields).forEach(function(kendoFieldName){
        self._updateModelField(kendoSchema, schema, kendoModel, instance, index, create, kendoFieldName);
    });
}

proto.toKendoModel = function(kendoSchema, instance, index) {
    var obj = {};
    var self = this;
    Object.keys(kendoSchema.fields).forEach(function(kendoFieldName){
        if(kendoFieldName === self.kendoFieldNameForArray && index !== undefined && index !== null) {
            obj[kendoFieldName] = parseInt(index) + 1;
            return;
        }
        var attrName = kendoFieldName.replace(kendoFieldSep, '.');
        obj[kendoFieldName] = typeof(instance) === 'object' ? instance.get(attrName) : instance;
        if(obj[kendoFieldName] === undefined) {
            obj[kendoFieldName] = null;
        }
        if(obj[kendoFieldName] && kendoSchema.fields[kendoFieldName].type == "date") {
            obj[kendoFieldName] = dateFormat(obj[kendoFieldName], 'isoUtcDateTime');
        }
    });
    return obj;
}

proto.buildKendoFieldsForSchema = function(schema, kendoFields, gridColumns, hiddenColumns, onSubType) {
    var schemaTypes = mongoose.Schema.Types;
    var self = this;
    var attrNames = Object.keys(schema.paths);

    for (var i = 0; i < attrNames.length; i++) {
        var attrName = attrNames[i];
        var attr = schema.paths[attrName];
        if(attr instanceof schemaTypes.Array        // use an ModelAdminPart
            || attr instanceof schemaTypes.Mixed    // use Json editor or edit as string
            || attr instanceof schemaTypes.Buffer) {// not supported. TODO:
            onSubType(attr, attrName);
            continue;
        }

        var kendos = self.buildKendoField(attr, attrName, schema, hiddenColumns);
        kendoFields[self.toKendoFieldName(attrName)] = kendos[0];
        gridColumns.push(kendos[1]);
    }
}

proto.buildKendoIdFieldForArray = function(kendoFields, gridColumns) {
    kendoFields.___index = {
        type: 'number',
        editable: false,
        validation: {
            step: 1,
            min: 0,
        },
    };
    gridColumns.push({
        field: '___index',
        title: '___index',
    });
}

proto.buildKendoFieldsForSimpleArray = function(attr, attrName, kendoFields, gridColumns, hiddenColumns) {
    hiddenColumns = hiddenColumns || [];
    var kendoFieldName = attrName.replace(/\./g, kendoFieldSep);
    this.buildKendoIdFieldForArray(kendoFields, gridColumns);
    var kendos = this.buildKendoField(attr, attrName, null, hiddenColumns);
    kendoFields[kendoFieldName] = kendos[0];
    gridColumns.push(kendos[1]);
};

proto.buildKendoField = function (attr, attrName, schema, hiddenColumns) {
    var schemaTypes = mongoose.Schema.Types;
    var field = {validation:{}};
    var kendoFieldName = this.toKendoFieldName(attrName);
    var column = {field: kendoFieldName, title: attrName};

    if(attr.options.default !== undefined) {
        field.defaultValue = attr.options.default;
    }
    field.validation.required = attr.options.required;
    if(!!(attrName !== '_id' && (!schema || (attrName !== schema.options.versionKey)))) {
        field.editable = true;
    } else {
        field.editable = false;
    }

    if(attrName !== '_id' && attr.options.ref) {
        field.ref = attr.options.ref;
    }

    if(hiddenColumns.indexOf(attrName) != -1) {
        column.hidden = true;
    }

    if(attr instanceof schemaTypes.String) {
        field.type = 'string';
        if(attr.options.match) {
            if(attr.options.match instanceof Array) {
                field.validation.pattern = attr.options.match[0] + '';
            } else {
                field.validation.pattern = attr.options.match + '';
            }
        }

        if(attr.options.enum && attr.options.enum.values) {
            Object.keys(attr.options.enum.values).forEach(function(value){
                column.values.push({text: value, value: value});
            });
        }
    } else if(attr instanceof schemaTypes.Number) {
        field.type = 'number';
        if(attr.options.max !== undefined) {
            field.validation.max = attr.options.max;
        }
        if(attr.options.min !== undefined) {
            field.validation.min = attr.options.min;
        }
    } else if(attr instanceof schemaTypes.Boolean) {
        field.type = 'boolean';
    } else if(attr instanceof schemaTypes.Date) {
        field.type = 'date';
        column.format = "{0: yyyy-MM-dd HH:mm:ss}";
    } else if(attr instanceof schemaTypes.ObjectId) {
        field.type = 'string';
        // TODO: mark field as a link
    } else {
        debugger;
        throw new Error(util.format('no such type found for schema path: path=%s, type=%s', attrName, typeof(attr)));
    }
    logger.debug('buildKendoField: attr=%s, attrName=%s, schema=%s, hiddenColumns=%s, field=%j, column=%j',
        attr, attrName, schema, hiddenColumns, field, column);
    return [field, column];
};


proto.buildColumnTemplateForRefField = function(kendoSchema, gridColumns, workflow) {
    var fields = kendoSchema.fields;
    var urlResolver = workflow.req.urlResolver;
    for (var i = 0; i < gridColumns.length - 1; i++) {
        var col = gridColumns[i];
        if(fields[col.field].ref) {
            col.template = '#if('+col.field+'){#<a target="_blank" href="%s">#= ' + col.field + ' #</a>#}#';
            col.template = util.format(col.template, urlResolver.resolveRefUrl(fields[col.field].ref, '________'));
            col.template = col.template.replace('________', '#= ' + col.field + ' #');
        }
    }
}

