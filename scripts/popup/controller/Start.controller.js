sap.ui.define([
        "com/ui5/testing/controller/BaseController",
        "com/ui5/testing/model/Communication",
        "com/ui5/testing/model/RecordController",
        "com/ui5/testing/model/Navigation",
        "sap/ui/model/json/JSONModel",
        "com/ui5/testing/model/ChromeStorage",
        "sap/m/MessageToast"
    ], function (BaseController, Communication, RecordController, Navigation, JSONModel, ChromeStorage, MessageToast) {
        "use strict";

        return BaseController.extend("com.ui5.testing.controller.Start", {
            onInit: function () {
                this._oModel = new JSONModel({
                    recording: false,
                    currentUrl: "",
                });
                this.getView().setModel(this._oModel, "viewModel");
                this.getView().setModel(RecordController.getModel(), "recordModel");
                RecordController.init(this.getOwnerComponent());
                this.getView().setModel(Navigation.getModel(), "navModel");
                this._getCurrentURL();

                Communication.isInitialized().then(function () {
                    if (Communication.isStartImmediate()) {
                        RecordController.injectScript().then(function () {
                            this.getModel("navModel").setProperty("/elements", []);
                            this.getModel("navModel").setProperty("/elementLength", 0);
                            this.getRouter().navTo("testDetailsCreateQuick");
                        }.bind(this), function () {
                            return;
                        });
                    }
                }.bind(this));
                this.getRouter().getRoute("start").attachPatternMatched(this._loadTableItems, this);
            },

            _getCurrentURL: function () {
                chrome.tabs.query({active: true, currentWindow: false}, function (tabs) {
                    var sUrl = "";
                    if (tabs && tabs[0]) {
                        sUrl = tabs[0].url;
                    }
                    this._oModel.setProperty("/currentUrl", sUrl);
                }.bind(this));
            },

            ui5Change: function () {
                this._getUI5Urls();
            },

            _getTabsForAll: function () {
                chrome.tabs.query({active: true, currentWindow: false}, function (tabs) {
                    this._oModel.setProperty('/urls', tabs);
                }.bind(this));
            },

            _getTabsForUI5: function () {
                chrome.tabs.query({currentWindow: false}, function (tabs) {
                    var aData = [];
                    for (var i = 0; i < tabs.length; i++) {
                        if (tabs[i].url && tabs[i].url.indexOf('chrome:') < 0) {
                            function checkUI5() {
                                return [].slice.call(document.head.getElementsByTagName('script')).filter(function (s) {
                                    return s.src.indexOf('sap-ui-core.js') > -1;
                                }).length == 1;
                            };

                            function callback(tabId, tabUrl) {
                                return function (results) {
                                    if (chrome.runtime.lastError) {
                                        console.log(chrome.runtime.lastError.message);
                                    } else {
                                        if (results[0]) {
                                            this._oModel.getProperty('/urls').push({url: tabUrl, id: tabId});
                                            this._oModel.updateBindings(true);
                                        }
                                    }
                                }
                            };
                            chrome.tabs.executeScript(tabs[i].id, {
                                    code: '(' + checkUI5 + ')();'
                                }, callback(tabs[i].id, tabs[i].url).bind(this)
                            );
                        }
                    }
                    if (chrome.runtime.lastError) {
                        console.log(chrome.runtime.lastError);
                    }
                    this._oModel.setProperty('/urls', aData);
                }.bind(this));
            },

            _getUI5Urls: function () {
                var bRequestUI5 = this.getView().byId('ui5Switch').getState();

                chrome.permissions.contains({
                    permissions: ['tabs'],
                    origins: ["https://*/*", "http://*/*"]
                }, function (result) {
                    if (!bRequestUI5) {
                        this._getTabsForAll();
                    } else {
                        if (result) {
                            this._getTabsForUI5();
                        } else {
                            chrome.permissions.request({
                                permissions: ['tabs'],
                                origins: ["https://*/*", "http://*/*"]
                            }, function (result) {
                                if (result) {
                                    //extract to method
                                    this._getTabsForUI5();
                                } else {
                                    MessageToast.show('No permissions granted! Showing only active tabs');
                                    this._getTabsForAll();
                                }
                            }.bind(this));
                        }
                    }
                }.bind(this));
            },

            /** view events **/



            /**
             * Sets the focus on the given Tab to easily find the correct tab to a given Url
             *
             * @param (sap.ui.base.Event) oEvent button event giving the correct tab id
             */
            onDisplayPage: function (oEvent) {
                var vTabId = oEvent.getSource().getBindingContext('viewModel').getObject().id;
                chrome.tabs.update(vTabId, {"active": true}, function (tab) {
                });
                chrome.tabs.get(vTabId, function (tab) {
                    chrome.windows.update(tab.windowId, {focused: true});
                });
            },

            onReloadTable: function () {
                this._getUI5Urls();
            },

            onStartNewRecording: function (oEvent) {
                var iId, sUrl;
                if(oEvent.getSource().getBindingContext('viewModel') && oEvent.getSource().getBindingContext('viewModel').getObject()) {
                    iId = oEvent.getSource().getBindingContext('viewModel').getObject().id;
                    sUrl = oEvent.getSource().getBindingContext('viewModel').getObject().url;
                }
                RecordController.injectScript(iId, sUrl).then(function () {
                    this.getModel("navModel").setProperty("/elements", []);
                    this.getModel("navModel").setProperty("/elementLength", 0);
                    this.getRouter().navTo("testDetailsCreate");
                }.bind(this), function () {
                    return;
                });
            },

            onMockserver: function (oEvent) {
                var iId, sUrl;
                if(oEvent.getSource().getBindingContext('viewModel') && oEvent.getSource().getBindingContext('viewModel').getObject()) {
                    iId = oEvent.getSource().getBindingContext('viewModel').getObject().id;
                    sUrl = oEvent.getSource().getBindingContext('viewModel').getObject().url;
                }
                RecordController.injectScript(iId, sUrl).then(function () {
                    this.getRouter().navTo("mockserver");
                }.bind(this), function () {
                    return;
                });
            },

            onOpenOverview: function () {
                this.getRouter().navTo("overview");
            },

            onOpenSettings: function () {
                this.getRouter().navTo("settings");
            },

            /** methods for already recorded tests **/

            _loadTableItems: function () {
                chrome.permissions.contains({
                    permissions: ['tabs'],
                    origins: ["https://*/*", "http://*/*"]
                }, function (result) {
                    if(result) {
                        this.getView().byId('ui5Switch').setState(true);
                    }
                    this._getUI5Urls();
                }.bind(this));
                ChromeStorage.getRecords({
                    path: '/items',
                    model: this._oModel
                });
            },

            onNavigateToTest: function (oEvent) {
                this.getRouter().navTo("testDetails", {
                    TestId: oEvent.getSource().getBindingContext("viewModel").getObject().uuid
                });
            },

            onAfterRendering: function () {
                document.getElementById("importOrigHelper").addEventListener("change", function (e) {
                    var files = e.target.files, reader = new FileReader();
                    var fnImportDone = function (input) {
                        this._importDone(JSON.parse(input.target.result));
                    }.bind(this);
                    reader.onload = fnImportDone;
                    reader.readAsText(files[0]);
                }.bind(this), false);
            },

            _importDone: function (oData) {
                ChromeStorage.saveRecord(oData)
                /*.then(function() {
                     //this._loadData();
                }.bind(this));*/
            },

            onImport: function () {
                document.getElementById("importOrigHelper").click();
            }
        });
    }
);
