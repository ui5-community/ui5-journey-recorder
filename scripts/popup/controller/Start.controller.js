sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "com/ui5/testing/model/ChromeStorage",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/Utils",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, Fragment, ChromeStorage, RecordController, Utils, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("com.ui5.testing.controller.Start", {
        /**
         *
         */
        onInit: function () {
            this._oModel = new JSONModel({
                recording: false,
                currentUrl: ""
            });
            this.getView().setModel(this._oModel, "viewModel");
            this.getRouter().getRoute("start").attachPatternMatched(this._loadTableItems, this);
        },

        /**
         *
         */
        ui5Change: function () {
            this._getUI5Urls();
        },

        /**
         *
         */
        _getTabsForAll: function () {
            chrome.tabs.query({
                active: true,
                currentWindow: false
            }, function (tabs) {
                this._oModel.setProperty('/urls', tabs);
            }.bind(this));
        },

        /**
         *
         */
        _getTabsForUI5: function () {
            chrome.tabs.query({
                currentWindow: false
            }, function (tabs) {
                var aData = [];
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].url && tabs[i].url.indexOf('chrome:') < 0) {
                        /**
                         *
                         */
                        function checkUI5() {
                            var normal = [].slice.call(document.head.getElementsByTagName('script')).filter(function (s) {
                                return s.src.indexOf('sap-ui-core.js') > -1;
                            }).length == 1;
                            var onPremise = [].slice.call(document.head.getElementsByTagName('script')).filter(function (s) {
                                return s.src.indexOf('/sap/bc/ui5_ui5/') > -1;
                            }).length >= 1;

                            if (!normal && !onPremise) {
                                //check if we are integrated into an iframe..
                                var iFrames = document.getElementsByTagName("iframe");
                                for (var i = 0; i < iFrames.length; i++) {
                                    if (iFrames[i].contentDocument) {
                                        normal = [].slice.call(iFrames[i].contentDocument.head.getElementsByTagName('script')).filter(function (s) {
                                            return s.src.indexOf('sap-ui-core.js') > -1 || s.src.indexOf('sap-ui-m-zen.js') > -1;
                                        }).length == 1;
                                        onPremise = [].slice.call(iFrames[i].contentDocument.head.getElementsByTagName('script')).filter(function (s) {
                                            return s.src.indexOf('/sap/bc/ui5_ui5/') > -1;
                                        }).length >= 1;

                                        if (normal || onPremise) {
                                            return true;
                                        }
                                    }
                                }
                            }

                            return normal || onPremise;
                        }

                        /**
                         *
                         * @param {*} tabId
                         * @param {*} tabUrl
                         */
                        function callback(tabId, tabUrl) {
                            return function (results) {
                                if (chrome.runtime.lastError) {
                                    //console.log(chrome.runtime.lastError.message);
                                } else if (results[0]) {
                                    this._oModel.getProperty('/urls').push({
                                        url: tabUrl,
                                        id: tabId
                                    });
                                    this._oModel.updateBindings(true);
                                }
                            };
                        }
                        chrome.tabs.executeScript(tabs[i].id, {
                            code: '(' + checkUI5 + ')();'
                        }, callback(tabs[i].id, tabs[i].url).bind(this));
                    }
                }
                if (chrome.runtime.lastError) {
                    //console.log(chrome.runtime.lastError);
                }
                this._oModel.setProperty('/urls', aData);
            }.bind(this));
        },

        /**
         *
         */
        _getUI5Urls: function () {
            var bRequestUI5 = this.getView().byId('ui5Switch').getState();

            if (!bRequestUI5) {
                this._getTabsForAll();
            } else {
                Utils.requestTabsPermission()
                    .then(
                        function () {
                            this._getTabsForUI5();
                        }.bind(this)
                    )
                    .catch(
                        function () {
                            MessageToast.show('No permissions granted! Showing only active tabs');
                            this._getTabsForAll();
                        }.bind(this)
                    );
            }
        },

        /**
         *
         */
        /** view events **/

        /**
         * Sets the focus on the given Tab to easily find the correct tab to a given Url
         *
         * @param (sap.ui.base.Event) oEvent button event giving the correct tab id
         */
        onDisplayPage: function (oEvent) {
            var vTabId = oEvent.getSource().getBindingContext('viewModel').getObject().id;
            chrome.tabs.update(vTabId, {
                "active": true
            }, function (tab) {
                chrome.windows.update(tab.windowId, {
                    focused: true
                });
            });
        },

        /**
         *
         */
        onReloadTable: function () {
            this._getUI5Urls();
        },

        /**
         *
         */
        onStartNewRecording: function (oEvent) {
            var iId;
            if (oEvent.getSource().getBindingContext('viewModel') && oEvent.getSource().getBindingContext('viewModel').getObject()) {
                iId = oEvent.getSource().getBindingContext('viewModel').getObject().id;
            }

            this._oConnectionEstablishingDialog.open();

            RecordController.getInstance().injectScript(iId)
                .then((oData) => {
                    this._oConnectionEstablishingDialog.close();
                    MessageToast.show(`Script injected: Page uses ${oData.name} at version ${oData.version}.`);
                    this.getRouter().navTo("TestDetailsCreate");
                })
                .catch((oData) => {
                    this._oConnectionEstablishingDialog.close();
                    MessageBox.error(oData.message);
                });
        },

        /**
         *
         */
        onMockserver: function (oEvent) {
            var iId;
            if (oEvent.getSource().getBindingContext('viewModel') && oEvent.getSource().getBindingContext('viewModel').getObject()) {
                iId = oEvent.getSource().getBindingContext('viewModel').getObject().id;
            }

            this._oConnectionEstablishingDialog.open();

            RecordController.getInstance().injectScript(iId).then((oData) => {
                this._oConnectionEstablishingDialog.close();
                MessageToast.show(`Script injected: Page uses ${oData.name} at version ${oData.version}.`);
                this.getRouter().navTo("mockdata");
            }).catch((oData) => {
                this._oConnectionEstablishingDialog.close();
                MessageBox.error(oData.message);
            });
        },

        /**
         *
         */
        onOpenSettings: function () {
            this.getRouter().navTo("settings");
        },

        /**
         *
         */
        _loadTableItems: function () {
            chrome.permissions.contains({
                permissions: ['tabs'],
                origins: ["https://*/*", "http://*/*"]
            }, function (result) {
                if (result) {
                    this.getView().byId('ui5Switch').setState(true);
                }
                this._getUI5Urls();
            }.bind(this));
            ChromeStorage.getRecords({
                path: '/items',
                model: this._oModel
            });
        },

        /**
         *
         */
        onNavigateToTest: function (oEvent) {
            this.getRouter().navTo("TestDetails", {
                TestId: oEvent.getSource().getBindingContext("viewModel").getObject().uuid
            });
        },

        /**
         *
         */
        onAfterRendering: function () {
            document.getElementById("importOrigHelper").addEventListener("change", function (e) {
                var files = e.target.files,
                    reader = new FileReader();
                var fnImportDone = function (input) {
                    this._importDone(JSON.parse(input.target.result));
                }.bind(this);
                reader.onload = fnImportDone;
                reader.readAsText(files[0]);
            }.bind(this), false);

            Fragment.load({
                name: "com.ui5.testing.fragment.ConnectionEstablishingDialog",
                controller: this
            }).then(function (oConnectionEstablishingDialog) {
                this._oConnectionEstablishingDialog = oConnectionEstablishingDialog;
            }.bind(this));
        },

        /**
         *
         */
        _importDone: function (oData) {
            oData.test.uuid = Utils.getUUIDv4();
            oData.test.createdAt = new Date().getTime();
            ChromeStorage.saveRecord(oData).then(function () {
                ChromeStorage.getRecords({
                    path: '/items',
                    model: this._oModel
                });
            }.bind(this));
        },

        /**
         *
         */
        onImport: function () {
            document.getElementById("importOrigHelper").click();
        }
    });
});