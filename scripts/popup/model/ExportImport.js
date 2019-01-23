sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageToast"
], function (UI5Object, MessageToast) {
    "use strict";

    var ExportImport = UI5Object.extend("com.ui5.testing.model.ExportImport", {
        constructor: function () {
        }
    });

    ExportImport.prototype.save = function (oSave) {
        return new Promise(function (resolve, reject) {
            var aExisting = [];
            chrome.storage.local.get(["items"], function (items) {
                if (items && items.items) {
                    aExisting = items.items;
                }
                //check if we are already existing (do not add twice to the array..)
                if (aExisting.filter(function (obj) { if (obj == oSave.test.uuid) { return true; } return false }).length === 0) {
                    aExisting.push(oSave.test.uuid);
                    chrome.storage.local.set({ "items": aExisting });
                }
                var oStore = {};
                oStore[oSave.test.uuid] = JSON.stringify(oSave);
                chrome.storage.local.set(oStore, function () {
                    MessageToast.show("Saved in local Storage");
                    resolve();
                });
            });
        }.bind(this));
    };

    return new ExportImport();
});