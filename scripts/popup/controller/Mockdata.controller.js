sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "sap/ui/model/json/JSONModel"
], function (
    BaseController,
    RecordController,
    Connection,
    ConnectionMessages,
    JSONModel) {
    "use strict";

    return BaseController.extend("com.ui5.testing.controller.Mockdata", {

        /**
         *
         */
        onInit: function () {
            this.getView().setModel(new JSONModel({}), "mockdataModel");
            this.getRouter().getRoute("mockdata").attachPatternMatched(this._onObjectMatched, this);
        },

        /**
         * 
         */
        _onObjectMatched: function () {
            var oRecordCont = RecordController.getInstance();
            ConnectionMessages.getODataV2Models(Connection.getInstance()).then((aResult) => {
                debugger;
            });
            debugger;
        }
    });
});