var mongoose = require('bicycle/db').mongoose;
var KendoAdapter = require('./KendoAdapter');


var ATTR_TYPE_ARRAY = 'array';
var ATTR_TYPE_DOCUMENT_ARRAY = 'documentArray';

function BasePartAdmin(admin, attr) {
    this.admin = admin;
    this.model = admin.model;
    this.modelAttr = attr;
    this.path = attr.path;
    this.kendoAdapter = new KendoAdapter();
    this.attrType = null; // one of ATTR_TYPE_*
    this.hiddenColumns = this.initHiddenColumns(attr);
    this.initKendoSchemaAndGridColumns();
}

module.exports = BasePartAdmin;
var proto = BasePartAdmin.prototype;
var kendoFieldSep = proto.kendoFieldSep = KendoAdapter.prototype.kendoFieldSep;

proto.initHiddenColumns = function(attr) {
    return [];
}

proto._getData = function(workflow, cb) {
    var _id = workflow.req.query._id;
    var self = this;
    this.model.findById(_id, function(err, instance){
        if(err) {
            return workflow.emit('exception', err);
        }
        cb(instance.get(self.path), instance);
    });
}

proto.list = function(workflow) {
    var self = this;
    this._getData(workflow, function(data) {
        if(!data) {
            workflow.outcome.results = [];
        } else if(self.attrType) {
            workflow.outcome.results = data.map(function(obj, i){
                return self.kendoAdapter.toKendoModel(self.kendoSchema, obj, i);
            });
        } else {
            throw new Error('no attrType definded: ' + self.attrType);
        }
        workflow.outcome.errors = '';
        workflow.outcome.total = workflow.outcome.results.length;
        workflow.emit('response');
    });
}

proto.create = function(workflow) {
    this.update(workflow, true);
}

proto.update = function(workflow, create) {
    var self = this;
    var models = workflow.req.body.models;
    this._getData(workflow, function(data, instance) {
        try{
            if(self.attrType === ATTR_TYPE_ARRAY) {
                workflow.outcome = self.kendoAdapter.updateModelForSimpleArray(
                    self.kendoSchema, instance[self.path].caster, models, instance, self.path, create);
            } else if(self.attrType === ATTR_TYPE_DOCUMENT_ARRAY) {
                workflow.outcome = self.kendoAdapter.updateModelForDocArray(
                    self.kendoSchema, instance[self.path]._schema.schema, models, instance, self.path, create);
            }
            instance.markModified(self.path);
            instance.save(function(err) {
                if(err) {
                    return workflow.emit('exception', err);
                } else {
                    workflow.outcome.errors = '';
                    workflow.emit('response');
                }
            });
        } catch(err) {
            return workflow.emit('exception', err);
        }
    });
}

proto.del = function(workflow) {
    var self = this;
    var models = workflow.req.body.models;
    this._getData(workflow, function(data, instance) {
        var ids = models.map(function(kendoModel){
            return parseInt(kendoModel[self.kendoAdapter.kendoFieldNameForArray]) - 1;
        });
        var obj = {};
        ids.forEach(function(id){obj[id] = 1});
        ids = Object.keys(obj).map(function(id){return parseInt(id)});
        ids.sort();
        for (var i = 0; i < ids.length; i++) {
            ids[i] -= i;
        }
        var arr = instance[self.path];
        for (var i = 0; i < ids.length; i++) {
            arr.splice(ids[i], 1);
        }
        instance.markModified(self.path);
        instance.save(function(err) {
            if(err) {
                return workflow.emit('exception', err);
            } else {
                workflow.outcome.errors = '';
                workflow.emit('response');
            }
        });
    });
}

proto.initKendoSchemaAndGridColumns = function() {
    var schemaTypes = mongoose.Schema.Types;

    var kendoSchema = this.kendoSchema = {
        id: '___index',
        fields: {},
    };
    var kendoFields = kendoSchema.fields;
    var gridColumns = this.gridColumns = [];

    var attr = this.modelAttr;
    var attrName = attr.path;

    if(attr instanceof schemaTypes.DocumentArray) {
        this.kendoAdapter.buildKendoIdFieldForArray(kendoFields, gridColumns);
        this.kendoAdapter.buildKendoFieldsForSchema(attr.schema, kendoFields, gridColumns, this.hiddenColumns,
            function(attr, attrName){
                var adminPort = this.getPartAdmin(attr, attrName);
                if(adminPort) {
                    this.parts.push(adminPort);
                }
            });
        // delete _id field
        delete kendoFields['_id'];
        for (var i = 0; i < gridColumns.length; i++) {
            if(gridColumns[i].field == '_id') {
                var c = gridColumns.splice(i, 1);
                break;
            }
        }
        this.attrType = ATTR_TYPE_DOCUMENT_ARRAY;
    } else if(attr instanceof schemaTypes.Array) {
        this.kendoAdapter.buildKendoFieldsForSimpleArray(
            attr.caster, attrName, kendoFields, gridColumns, this.hiddenColumns);
        this.attrType = ATTR_TYPE_ARRAY;
    } else {
        throw new Error('not supported for adminPart type: ' + typeof(attr));
    }

    // add commands for gridColumns
    if(this.editable() == 'popup') {
        gridColumns.push({command: ["edit","destroy"]});
    } else {
        gridColumns.push({command: ["destroy"]});
    }

}

proto.editable = function() {
    return true;
}

proto.config = function(basepath, workflow) {
    var capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    var config = {
        "title": capitalize(this.path).replace(/\./, ' '),
        "className": this.path,
        "type": "grid",
        "gridConf": {
            "dataSource": {
                "transport": {
                    "read":  {
                        "url": basepath + '/list/',
                    },
                    "update": {
                        "url": basepath + '/update/',
                        "type": "POST",
                    },
                    "destroy": {
                        "url": basepath + '/delete/',
                        "type": "POST"
                    },
                    "create": {
                        "url": basepath + '/create/',
                        "type": "POST"
                    }
                },
                "batch": true,
                "schema": {
                    "model": this.kendoSchema,
                    data: 'results',
                    errors: 'errors',
                }
            },
            "pageable": false,
            //"height": 500,
            "toolbar": ["create", "save", "cancel"],
            "navigatable": true,
            "editable": this.editable(),
            "scrollable": true,
            "columns": this.gridColumns,
        }
    }

    this.kendoAdapter.buildColumnTemplateForRefField(this.kendoSchema, this.gridColumns, workflow);

    return config;
}

proto.routes = function() {
    return {
        post: [
            {url: '/create/', handler: this.create},
            {url: '/update/', handler: this.update},
            {url: '/delete/', handler: this.del},
        ],
        get: [
            {url: '/config/', handler: this.config},
            {url: '/list/', handler: this.list},
        ]
    }
}

