sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "com/ui5/testing/model/GlobalSettings",
    "com/ui5/testing/model/ChromeStorage",
    "sap/m/MessageToast"
], function (BaseController, GlobalSettings, ChromeStorage, MessageToast) {
    "use strict";

    return BaseController.extend("com.ui5.testing.controller.Settings", {
        onInit: function () {
            this.getRouter().getRoute("settings").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            GlobalSettings.load();
        },


        onSave : function() {
            GlobalSettings.save();
            this.getRouter().navTo("start");
        },

        onClearSettings : function() {
            ChromeStorage.remove({
                key: 'settings'
            });
            MessageToast.show("Cleared settings");
            GlobalSettings.load();
        }
    });
});
