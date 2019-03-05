sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "com/ui5/testing/model/Communication",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/Navigation",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/ChromeStorage"
], function (BaseController,
             Communication,
             RecordController,
             Navigation,
             JSONModel,
             ChromeStorage) {
    "use strict";

    return BaseController.extend("com.ui5.testing.controller.Overview", {
        onInit: function () {
            this._oModel = new JSONModel({
                recording: false
            });
            this.getView().setModel(this._oModel, "viewModel");
            this.getRouter().getRoute("overview").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            ChromeStorage.getRecords({
                path: '/items',
                model: this._oModel
            });
        },

        onAfterRendering: function () {
            var that = this;
            document.getElementById("importOrigHelper").addEventListener("change", function (e) {
                var files = e.target.files, reader = new FileReader();
                var fnImportDone = function () {
                    that._importDone(JSON.parse(this.result));
                }
                reader.onload = fnImportDone;
                reader.readAsText(files[0]);
            }, false);
        },

        _importDone: function (oData) {
            ChromeStorage.saveRecord(oData)
                       /*.then(function() {
                            //this._loadData();
                       }.bind(this));*/
        },

        onImport : function() {
            document.getElementById("importOrigHelper").click();
        },

        onNavigateToTest: function (oEvent) {
            this.getRouter().navTo("testDetails", {
                TestId: oEvent.getSource().getBindingContext("viewModel").getObject().uuid
            });
        }
    });
});