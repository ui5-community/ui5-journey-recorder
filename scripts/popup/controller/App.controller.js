sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/Utils",
    "com/ui5/testing/model/GlobalSettings"
], function (Controller, JSONModel, Utils, GlobalSettings) {
    "use strict";

    return Controller.extend("com.ui5.testing.controller.App", {
        onInit: function() {
            //If necessary initialize the global model for all test records
            if(!this.getOwnerComponent().getModel('records')) {
                this.getOwnerComponent().setModel(new JSONModel({}), 'records');
            }

            //setup the global model for constants
            if(!this.getOwnerComponent().getModel('constants')) {
                this.getOwnerComponent().setModel(new JSONModel(Utils.statics), 'constants');
            }

            //setup the global settings model
            if(!this.getOwnerComponent().getModel('settings')) {
                this.getOwnerComponent().setModel(GlobalSettings.getModel(), 'settings');
            }
        }
    });
});
