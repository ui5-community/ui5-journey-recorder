sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";
    var ChromeStorage = {
        /**
         *
         * @param {*} oSettings
         */
        set: function (oSettings) {
            const requestKey = oSettings.key;
            const oData = oSettings.data;
            const successCallback = oSettings.success;
            const failureCallback = oSettings.failure;
            var storageObject = {};
            storageObject[requestKey] = oData;

            chrome.storage.local.set(storageObject, function (obj) {
                if (obj && obj[requestKey]) {
                    if (successCallback) successCallback(obj[requestKey])
                } else {
                    if (failureCallback) failureCallback(chrome.runtime.lastError)
                }
            });
        },

        /**
         *
         */
        get: function (oSettings) {
            const requestKey = oSettings.key;
            const successCallback = oSettings.success;
            const failureCallback = oSettings.failure;

            chrome.storage.local.get(requestKey, function (obj) {
                if (obj && obj[requestKey]) {
                    if (successCallback) successCallback(obj[requestKey])
                } else {
                    if (failureCallback) failureCallback(chrome.runtime.lastError)
                }
            });
        },

        /**
         *
         */
        remove: function (oSettings) {
            const requestKey = oSettings.key;
            const successCallback = oSettings.success;
            const failureCallback = oSettings.failure;

            chrome.storage.local.remove(requestKey, function (obj) {
                if (obj && obj[requestKey]) {
                    if (successCallback) successCallback(obj[requestKey])
                } else {
                    if (failureCallback) failureCallback(chrome.runtime.lastError)
                }
            });
        },

        /**
         *
         */
        getRecords: function (oSettings) {
            var oModel = oSettings.model;
            var sPath = oSettings.path;
            var successCallback = oSettings.success;

            var aItems = [];
            oModel.setProperty(sPath, []);
            chrome.storage.local.get(["items"], function (items) {
                if (items && items.items) {
                    aItems = items.items;
                }
                var aDataStore = [];
                chrome.storage.local.get(aItems, function (aData) {
                    for (var sId in aData) {
                        var oData = JSON.parse(aData[sId]);
                        aDataStore.push({
                            uuid: oData.test.uuid,
                            createdAt: new Date(oData.test.createdAt),
                            testName: oData.codeSettings.testName,
                            testCategory: oData.codeSettings.testCategory,
                            testUrl: oData.codeSettings.testUrl
                        });
                    }
                    oModel.setProperty(sPath, aDataStore);
                    if (successCallback) {
                        successCallback();
                    }
                });
            });
        },

        /**
         *
         */
        deleteTest: function (sTestId) {
            return new Promise(function (resolve, reject) {
                var aExisting = [];
                chrome.storage.local.get(["items"], function (items) {
                    if (items && items.items) {
                        aExisting = items.items;
                    }
                    //check if we are already existing (do not add twice to the array..)
                    var iIndex = aExisting.indexOf(sTestId);
                    if (iIndex === -1) {
                        reject();
                    }
                    aExisting.splice(iIndex, 1);
                    chrome.storage.local.set({
                        "items": aExisting
                    });
                    chrome.storage.local.remove(sTestId);
                    resolve();
                });
            });
        },

        /**
         *
         */
        saveRecord: function (oSave) {
            return new Promise(function (resolve, reject) {
                var aExisting = [];
                chrome.storage.local.get(["items"], function (items) {
                    if (items && items.items) {
                        aExisting = items.items;
                    }
                    //check if we are already existing (do not add twice to the array..)
                    if (aExisting.filter(function (obj) {
                            return obj === oSave.test.uuid;
                        }).length === 0) {
                        aExisting.push(oSave.test.uuid);
                        chrome.storage.local.set({
                            "items": aExisting
                        });
                    }
                    var oStore = {};

                    //fix for cycling object
                    delete oSave.codeSettings.execComponent;

                    oStore[oSave.test.uuid] = JSON.stringify(oSave);
                    chrome.storage.local.set(oStore, function () {
                        MessageToast.show("Saved in local Storage");
                        resolve();
                    });
                });
            }.bind(this));
        }
    };
    return ChromeStorage;
});
