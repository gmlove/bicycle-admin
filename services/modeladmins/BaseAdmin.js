var models = require('bicycle').models[require('../../config').appName];
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);
var util = require('util');
var mongoose = require('bicycle/db').mongoose;
var dateFormat = require('dateformat');
var async = require('async');
var KendoAdapter = require('./KendoAdapter');

function BaseAdmin(appName, modelName, model) {
    this.appName = appName;
    this.modelName = modelName;
    this.model = model;
    this.kendoSchema = null;
    this.gridColumns = null;
    this.adminParts = [];
    this.kendoAdapter = new KendoAdapter();
    this.hiddenColumns = this.initHiddenColumns(model);
    this.initKendoSchemaAndGridColumns();
    this.pageSize = 20;
}


module.exports = BaseAdmin;
var proto = BaseAdmin.prototype;

var kendoFieldSep = proto.kendoFieldSep = KendoAdapter.prototype.kendoFieldSep;


proto.initHiddenColumns = function(model) {
    return [model.schema.options.versionKey]
}

proto.editable = function() {
    if(!this.hiddenColumns.length
        || (this.hiddenColumns.length == 1
            && this.hiddenColumns[0] == this.model.schema.options.versionKey)) {
        return true;
    }
    return 'popup';
}

proto._parseFilter = function(kendoFilter) {
    var filter = {};
    if(!kendoFilter) {
    } else if(kendoFilter.logic) {
        var subFilters = filter['$' + kendoFilter.logic] = [];
        for (var i = 0; i < kendoFilter.filters.length; i++) {
            subFilters.push(this._parseFilter(kendoFilter.filters[i]));
        }
    } else if(!kendoFilter.operator) {
    } else {
        var field = kendoFilter.field.replace(kendoFieldSep, '.');
        switch(kendoFilter.operator) {
            case "lt":
            case "lte":
            case "gt":
            case "gte":
                filter[field] = {};
                filter[field]['$' + kendoFilter.operator] = kendoFilter.value;
                break;
            case "eq":
                filter[field] = kendoFilter.value;
                break;
            case "neq":
                filter[field] = {'$ne': kendoFilter.value};
                break;
            case "startswith":
                filter[field] = {'$regex': '^' + kendoFilter.value};
                break;
            case "endswith":
                filter[field] = {'$regex': kendoFilter.value + '$'};
                break;
            case "contains":
                filter[field] = {'$regex': kendoFilter.value};
                break;
            case "doesnotcontain":
                filter[field] = {'$not': new RegExp(kendoFilter.value)};
                break;
            default:
                throw new Error('unknown kendo operator: ' + kendoFilter.operator);
                break;
        }
    }
    return filter;
}

proto._parseSort = function(kendoSort) {
    var sort = {};
    if(kendoSort) {
        for (var i = 0; i < kendoSort.length; i++) {
            sort[kendoSort[i].field] = kendoSort[i].dir;
        }
    }
    return sort;
}

proto._toKendoModel = function(instance){
    return this.kendoAdapter.toKendoModel(this.kendoSchema, instance);
}

proto.list = function(workflow) {
    var self = this;
    var filter = this._parseFilter(workflow.req.query.filter);
    var sort = this._parseSort(workflow.req.query.sort);
    var skip = parseInt(workflow.req.query.skip);

    this.model.find(filter).sort(sort).skip(skip).limit(this.pageSize).exec(function(err, models) {
        if(err) {
            logger.error('error occured: ', err);
            return workflow.emit('exception', err);
        }
        workflow.outcome.results = models.map(self._toKendoModel.bind(self));
        self.model.count(filter, function(err, count) {
            if(err) {
                logger.error('error occured: ', err);
                return workflow.emit('exception', err);
            }
            workflow.outcome.errors = '';
            workflow.outcome.total = count;
            workflow.emit('response');
        });
    });
}

proto._updateModel = function(kendoModel, create, cb) {
    var self = this;
    var schemaTypes = mongoose.Schema.Types;
    var onUpdate = function(err, instance) {
        if(err) {
            return cb(err);
        }
        self.kendoAdapter.updateModel(self.kendoSchema, self.model.schema, kendoModel,
            instance, null, create);
        instance.save(function(err, savedInstance){
            cb(err, savedInstance);
        });
    };
    if(create) {
        onUpdate(null, new this.model({}));
    } else {
        this.model.findById(kendoModel._id, onUpdate);
    }
}

proto.update = function(workflow, create) {
    var models = workflow.req.body.models;
    var self = this;
    var results = [];
    var tasks = models.map(function(model) {
        return function(cb) {
            self._updateModel(model, create, function(err, instance){
                if(instance) {
                    results.push(self._toKendoModel(instance));
                }
                cb(err);
            });
        };
    });
    async.parallel(tasks, function(err){
        if(err) {
            return workflow.emit('exception', err);
        }
        workflow.outcome = results;
        return workflow.emit('response');
    });
}

proto.create = function(workflow) {
    this.update(workflow, true);
}

proto.del = function(workflow) {
    var models = workflow.req.body.models;
    var self = this;
    var tasks = models.map(function(model) {
        return function(cb) {
            self.model.remove({_id: model['_id']}, cb);
        };
    });
    async.parallel(tasks, function(err){
        if(err) {
            return workflow.emit('exception', err);
        }
        workflow.outcome = models;
        return workflow.emit('response');
    });
}

proto.getPartAdmin = function(attr, path) {
    var schemaTypes = mongoose.Schema.Types;
    if(attr instanceof schemaTypes.Array) {
        var caster = attr.caster;
        // ignore complicate sub type
        if(caster instanceof schemaTypes.Array
            || caster instanceof schemaTypes.Mixed
            || caster instanceof schemaTypes.Buffer) {
            return null;
        }
        var BasePartAdmin = require('./BasePartAdmin');
        return new BasePartAdmin(this, attr, path);
    }
    return null;
}

proto.initKendoSchemaAndGridColumns = function() {
    var model = this.model;
    var kendoSchema = this.kendoSchema = {
        id: '_id',
        fields: {},
    };
    var gridColumns = this.gridColumns = [];
    var kendoFields = kendoSchema.fields;

    var self = this;
    this.kendoAdapter.buildKendoFieldsForSchema(model.schema, kendoFields, gridColumns, this.hiddenColumns,
        function(attr, attrName){
            var adminPart = self.getPartAdmin(attr, attrName);
            if(adminPart) {
                self.adminParts.push(adminPart);
            }
        });

    // adjust _id to the first column
    for (var i = 0; i < gridColumns.length; i++) {
        if(gridColumns[i].field == '_id') {
            var c = gridColumns.splice(i, 1);
            gridColumns.splice(0, 0, c[0]);
            break;
        }
    }

    // add commands for gridColumns
    if(this.editable() == 'popup') {
        gridColumns.push({command: ["edit","destroy"]});
    } else {
        gridColumns.push({command: ["destroy"]});
    }
}


proto.config = function(workflow) {
    var basepath = workflow.req.originalUrl.replace(/^([^?]+)\/config\/.*$/, '$1');
    var config = workflow.outcome = {
        "grid": {
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
                    serverFiltering: true,
                    serverPaging: true,
                    serverSorting: true,
                    "pageSize": this.pageSize,
                    "schema": {
                        "model": this.kendoSchema,
                        data: 'results',
                        errors: 'errors',
                        total: 'total',
                    }
                },
                "pageable": true,
                //"height": 500,
                "toolbar": ["create", "save", "cancel"],
                "navigatable": true,
                "editable": this.editable(),
                "reorderable": true,
                "resizable": true,
                "scrollable": true,
                "filterable": {
                    "extra": true
                },
                "columnMenu": {
                    "sortable": true
                },
                "sortable": {
                    "mode": "multiple"
                },
                "columns": this.gridColumns,
            },
            "tabs":[]
        }
    }

    this.kendoAdapter.buildColumnTemplateForRefField(this.kendoSchema, this.gridColumns, workflow);

    this.adminParts.forEach(function(partAdmin) {
        var partBasePath = basepath + '/' + partAdmin.path;
        config.grid.tabs.push(partAdmin.config(partBasePath, workflow));
    });

    workflow.emit('response');
}

proto.routes = function() {
    var routes = {
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

    // add route for parts,simply add a path prefix
    this.adminParts.forEach(function(adminPart) {
        var partRoutes = adminPart.routes();
        var path = adminPart.path;
        Object.keys(partRoutes).forEach(function(method){
            partRoutes[method].forEach(function(route){
                routes[method] = routes[method] || [];
                routes[method].push({
                    url: '/' + path + route.url,
                    handler: route.handler.bind(adminPart)
                });
            });
        });
    });

    return routes;
}