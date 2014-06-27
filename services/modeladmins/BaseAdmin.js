var models = require('bicycle').models[require('../../config').appName];
var logger = require('bicycle/logger').getLogger('bicycle-admin', __filename);

var BaseAdmin = function (appName, modelName, model) {
    this.appName = appName;
    this.modelName = modelName;
    this.model = model;
}


module.exports = BaseAdmin;
var proto = BaseAdmin.prototype;

proto.list = function(workflow) {
    workflow.outcome = [
        {
            "username": "xx1",
            "nickname": "...",
            "avatar": "http://www.baidu.com",
            "email": "123@qq.com",
            "isActive": true,
            "timeCreated": "2014-06-11T12:00:00.000Z",
            "_id": "xxx"
        },
        {
            "username": "xx1",
            "nickname": "...",
            "avatar": "http://www.baidu.com",
            "email": "123@qq.com",
            "isActive": true,
            "timeCreated": "2014-06-11T12:00:00.000Z",
            "_id": "xxx"
        },
        {
            "username": "xx1",
            "nickname": "...",
            "avatar": "http://www.baidu.com",
            "email": "123@qq.com",
            "isActive": true,
            "timeCreated": "2014-06-11T12:00:00.000Z",
            "_id": "xxx"
        },
        {
            "username": "xx1",
            "nickname": "...",
            "avatar": "http://www.baidu.com",
            "email": "123@qq.com",
            "isActive": true,
            "timeCreated": "2014-06-11T12:00:00.000Z",
            "_id": "xxx"
        },
        {
            "username": "xx1",
            "nickname": "...",
            "avatar": "http://www.baidu.com",
            "email": "123@qq.com",
            "isActive": true,
            "timeCreated": "2014-06-11T12:00:00.000Z",
            "_id": "xxx"
        }
    ];
    workflow.emit('response');
}

proto.update = function(workflow) {

}

proto.create = function(workflow) {

}

proto.del = function(workflow) {

}

proto.config = function(workflow) {
    var basepath = workflow.req.originalUrl.replace(/^([^?]+)\/config\/.*$/, '$1');
    workflow.outcome = {
        "grid": {
            "gridConf": {
                "dataSource": {
                    "transport": {
                        "read":  {
                            "url": basepath + '/list/',
                        },
                        "update": {
                            "url": basepath + '/update/',
                            "type": "post",
                        },
                        "destroy": {
                            "url": basepath + '/delete/',
                            "type": "post"
                        },
                        "create": {
                            "url": basepath + '/create/',
                            "type": "post"
                        }
                    },
                    "batch": true,
                    "pageSize": 20,
                    "schema": {
                        "model": {
                            "id": "_id",
                            "fields": {
                                "_id": {},
                                "username": {},
                                "nickname": {},
                                "avatar": {},
                                "email": {},
                                "isActive": {"type": "boolean"},
                                "timeCreated": {"type": "date", "nullable": true}
                            }
                        }
                    }
                },
                "pageable": true,
                "height": 500,
                "toolbar": ["create", "save", "cancel"],
                "navigatable": true,
                "editable": true,
                "reorderable": true,
                "resizable": true,
                "scrollable": true,
                "filterable": {
                    "extra": true
                },
                "columnMenu": {
                    "sortable": true
                },
                "columns": [
                    {"title": "User Name", "field": "username", "width": "100px"},
                    {"title": "Nick Name", "field": "nickname", "width": "100px"},
                    {"title": "Avatar", "field": "avatar", "width": "100px"},
                    {"title": "Email", "field": "email", "width": "100px"},
                    {"title": "Active", "field": "isActive", "width": "100px"},
                    {"title": "Time Created", "field": "timeCreated", "width": "100px"},
                    {"command": ["destroy"], "title": "&nbsp;", "width": "172px" }
                ]
            },
            "tabs":[
                {
                    "title": "Orders",
                    "className": "orders",
                    "type": "grid",
                    "gridConf": {
                        "dataSource": {
                            "transport": {
                                "read":  {
                                    "url": "../data/models/users.json"
                                },
                                "update": {
                                    "url": "http://demos.telerik.com/kendo-ui/service/Products/Update",
                                    "dataType": "jsonp"
                                },
                                "destroy": {
                                    "url": "http://demos.telerik.com/kendo-ui/service/Products/Destroy",
                                    "dataType": "jsonp"
                                },
                                "create": {
                                    "url": "http://demos.telerik.com/kendo-ui/service/Products/Create",
                                    "dataType": "jsonp"
                                }
                            },
                            "batch": true,
                            "pageSize": 20,
                            "schema": {
                                "model": {
                                    "id": "_id",
                                    "fields": {
                                        "_id": {},
                                        "username": {},
                                        "nickname": {},
                                        "avatar": {},
                                        "email": {},
                                        "isActive": {"type": "boolean"},
                                        "timeCreated": {"type": "date", "nullable": true}
                                    }
                                }
                            }
                        },
                        "pageable": true,
                        "height": 500,
                        "toolbar": ["create", "save", "cancel"],
                        "navigatable": true,
                        "editable": true,
                        "columns": [
                            {"title": "User Name", "field": "username", "width": "100px"},
                            {"title": "Nick Name", "field": "nickname", "width": "100px"},
                            {"title": "Avatar", "field": "avatar", "width": "100px"},
                            {"title": "Email", "field": "email", "width": "100px"},
                            {"title": "Active", "field": "isActive", "width": "100px"},
                            {"title": "Time Created", "field": "timeCreated", "width": "100px"},
                            {"command": ["destroy"], "title": "&nbsp;", "width": "172px" }
                        ]
                    }
                },
                {
                    "title": "Contact Information"
                }
            ]
        }
    }

    workflow.emit('response');
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