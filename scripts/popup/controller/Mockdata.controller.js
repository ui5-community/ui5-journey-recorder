sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (
    BaseController,
    RecordController,
    Connection,
    ConnectionMessages,
    JSONModel,
    Fragment) {
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

            Fragment.load({
                name: "com.ui5.testing.fragment.ComponentDialog",
                controller: this
            }).then(function (oWaitDialog) {
                this._oWaitingDialog = oWaitDialog;
                /* this._oRecordDialog.attachClose(this.onStopRecord, this); */
                var iTimeoutID = setTimeout(function () {
                    this._oWaitingDialog.open();
                }.bind(this), 1000 /* 1 sec enough? */ );
                ConnectionMessages.rootComponentAvailable(Connection.getInstance()).then(function (oData) {
                    clearTimeout(iTimeoutID);
                    this._oWaitingDialog.close();
                    debugger;
                }.bind(this));
            }.bind(this));
        },

        /**
         *
         */
        retrieveODataV2: function () {
            ConnectionMessages.getODataV2Models(Connection.getInstance()).then(function (oData) {
                debugger;
            });
        }
    });
});