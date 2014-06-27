define('list', ['jquery','utils', 'k/kendo.web', 'k/kendo.timezones'],
function ($, utils) {

var modelName = utils.pageParsedUrl.params['model'];
var modelData = null;
var detailTemplate = kendo.template(
'<div class="tabstrip">\
    <ul>\
    # for (var i = 0; i < tabs.length; i++) { #\
        <li # if(i == 0) { # class="k-state-active" # } #>#= tabs[i].title #</li>\
    # } #\
    </ul>\
    # for (var i = 0; i < tabs.length; i++) { #\
    <div>\
        <div class="#= tabs[i].className #"></div>\
    </div>\
    # } #\
</div>'
);

var detailInit = function(e) {
    console.log('detailInit: ', e);
    var detailRow = e.detailRow;

    detailRow.find(".tabstrip").kendoTabStrip({
        animation: {
            open: { effects: "fadeIn" }
        }
    });

    for (var i = 0; i < modelData.grid.tabs.length; i++) {
        var tab = modelData.grid.tabs[i];
        switch(tab.type) {
            case "grid":
                var gridConf = tab.gridConf;
                gridConf.dataSource.transport.parameterMap = function(options, operation) {
                    if (operation !== "read" && options.models) {
                        return {models: kendo.stringify(options.models)};
                    }
                };
                detailRow.find("." + tab.className).kendoGrid(gridConf);
                break;
            default:
                console.error('not supported tab.type: ', tab.type);
                break;
        }
    };

/*
    detailRow.find(".orders").kendoGrid({
        dataSource: {
            type: "odata",
            transport: {
                read: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Orders",
                "dataType": "jsonp"
            },
            serverPaging: true,
            serverSorting: true,
            serverFiltering: true,
            pageSize: 5,
            //filter: { field: "EmployeeID", operator: "eq", value: e.data.EmployeeID }
            filter: { field: "EmployeeID", operator: "eq", value: 1 }
        },
        scrollable: false,
        sortable: true,
        pageable: true,
        columns: [
            { field: "OrderID", title:"ID", width: "56px" },
            { field: "ShipCountry", title:"Ship Country", width: "110px" },
            { field: "ShipAddress", title:"Ship Address" },
            { field: "ShipName", title: "Ship Name", width: "190px" }
        ]
    });
*/
}


$.get('../../webapi/admin/' + modelName + '/config/', function(data) {
    modelData = data;
    var gridConf = data.grid.gridConf;
    gridConf.dataSource.transport.parameterMap = function(options, operation) {
        if (operation !== "read" && options.models) {
            return {models: kendo.stringify(options.models)};
        }
    };
    if(data.grid.tabs && data.grid.tabs.length) {
        gridConf.detailTemplate = detailTemplate({tabs: data.grid.tabs});
        gridConf.detailInit = detailInit;
        gridConf.dataBound = function() {
            this.expandRow(this.tbody.find("tr.k-master-row").first());
        }
    }
    $("#grid").kendoGrid(gridConf);
});

return;

var crudServiceBaseUrl = "http://demos.telerik.com/kendo-ui/service",
    dataSource = new kendo.data.DataSource({
    transport: {
        read:  {
            url: crudServiceBaseUrl + "/Products",
            dataType: "jsonp"
        },
        update: {
            url: crudServiceBaseUrl + "/Products/Update",
            dataType: "jsonp"
        },
        destroy: {
            url: crudServiceBaseUrl + "/Products/Destroy",
            dataType: "jsonp"
        },
        create: {
            url: crudServiceBaseUrl + "/Products/Create",
            dataType: "jsonp"
        },
        parameterMap: function(options, operation) {
            if (operation !== "read" && options.models) {
                return {models: kendo.stringify(options.models)};
            }
        }
    },
    batch: true,
    pageSize: 20,
    schema: {
        model: {
            id: "ProductID",
            fields: {
                ProductID: { editable: false, nullable: true },
                ProductName: { validation: { required: true } },
                UnitPrice: { type: "number", validation: { required: true, min: 1} },
                Discontinued: { type: "boolean" },
                UnitsInStock: { type: "number", validation: { min: 0, required: true } }
            }
        }
    }
});

$("#grid").kendoGrid({
    dataSource: dataSource,
    pageable: true,
    height: 430,
    toolbar: ["create"],
    columns: [
        "ProductName",
        { field: "UnitPrice", title: "Unit Price", format: "{0:c}", width: "100px" },
        { field: "UnitsInStock", title:"Units In Stock", width: "100px" },
        { field: "Discontinued", width: "100px" },
        { command: ["edit", "destroy"], title: "&nbsp;", width: "172px" }],
    editable: "inline"
});

});

//@ sourceURL=list.js