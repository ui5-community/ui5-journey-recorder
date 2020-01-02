/* eslint-disable require-jsdoc */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/Communication",
    "com/ui5/testing/model/Navigation",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (UI5Object, JSONModel, Communication, Navigation, MessageToast, MessageBox) {
    "use strict";

    /**
     * Singleton instance for RecordController
     */
    var oInstance;

    var RecordController = UI5Object.extend("com.ui5.testing.model.RecordController", {
        constructor: function () {
            var oJSON = {
                recording: false
            };
            this._oModel = new JSONModel(oJSON);
            this._sTabId = "";
            this._sLastTabId = "";
            this._oInitializedPromise = null;
            this._bIsInjected = false;
            this._oComponent = null;
            Communication.registerEvent("stopped", this._onStopped.bind(this));
            Communication.registerEvent("loaded", this._onInjectionDone.bind(this));
            this._oURLPopover = this._oRecordDialog = sap.ui.xmlfragment(
                "com.ui5.testing.fragment.SelectURL",
                this
            );
            this._oURLPopover.setModel(this._oModel, "viewModel");
        }
    });

    RecordController.prototype.focusPopup = function () {
        if (Communication.getOwnWindowId()) {
            chrome.windows.update(Communication.getOwnWindowId(), {
                focused: true
            });
        }
    };

    RecordController.prototype.focusTargetWindow = function () {
        chrome.tabs.update(this._sTabId, {
            "active": true
        });
        chrome.tabs.get(this._sTabId, function (tab) {
            chrome.windows.update(tab.windowId, {
                focused: true
            });
        });
    };

    RecordController.prototype.closeTab = function () {
        MessageBox.show(
            "You closed the session, the tab involved also?", {
                icon: MessageBox.Icon.QUESTION,
                title: "Close current Tab?",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        return new Promise(function (resolve, reject) {
                            chrome.tabs.remove(this._sTabId, function () {
                                if (chrome.runtime.lastError) {
                                    reject();
                                }
                                this._bIsInjected = false;
                                this._sTabId = "";
                                resolve();
                            }.bind(this));
                        }.bind(this));
                    } else {
                        return new Promise(function () {});
                    }
                }.bind(this)
            }
        );

    };

    RecordController.prototype.getModel = function () {
        return this._oModel;
    };

    RecordController.prototype.init = function (oComponent) {
        this._oComponent = oComponent;
    };

    RecordController.prototype.startRecording = function () {
        var bStartForControl = Communication.isStartImmediate();
        Communication.setStartImmediate(false);
        Communication.fireEvent("start", {
            startImmediate: typeof bStartForControl !== "undefined" ? bStartForControl : false
        });
        this._oModel.setProperty("/isRecording", true);
        if (bStartForControl !== true) {
            this.focusTargetWindow();
        }
    };

    RecordController.prototype.stopRecording = function () {
        if (this._oModel.getProperty("/isRecording") === true) {
            Communication.fireEvent("stop");
            Communication.fireEvent("unlock");
            this._onStopped();
        }
    };

    RecordController.prototype._onStopped = function () {
        this._oModel.setProperty("/isRecording", false);
        this._bIsInjected = false;
    };


    RecordController.prototype._onInjectionDone = function (oData) {
        if (oData.ok === true) {
            this._oInitPromiseResolve();
            window.onbeforeunload = function () {
                //inform our window, to clean up!
                this.stopRecording();
            }.bind(this);
            MessageToast.show("Initialization for " + this._sCurrentURL + " succeed. UI5 " + oData.version + " is used");
        } else {
            MessageToast.show("Recording for " + this._sCurrentURL + " not possible. UI5 is not used on that page.");
        }
    };

    RecordController.prototype._checkWindowLifecycle = function () {
        chrome.tabs.onUpdated.addListener(function (tabid, changeInfo) {
            if (tabid === this._sTabId) {
                //check if we are still injected..
                if (this._bIsInjected === true) {
                    chrome.tabs.sendMessage(this._sTabId, {
                        type: "ui5-check-if-injected"
                    }, function (response) {
                        if (chrome.runtime.lastError) {
                            setTimeout(this._checkWindowLifecycle.this, 500);
                        }
                        if (this._bIsInjected === true && (typeof response === "undefined" || typeof response.injected === "undefined")) {
                            //console.log('Reset injection flag!');
                            this._bIsInjected = false;
                            //ok - we are not.. reset our promise, we have to inject again..
                            sap.ui.getCore().getEventBus().publish("RecordController", "windowFocusLost", {});
                        }
                    }.bind(this));
                }
            }
        }.bind(this));
    };

    RecordController.prototype.isInjected = function () {
        return this._bIsInjected;
    };

    RecordController.prototype.isRecording = function () {
        return this._oModel.getProperty("/isRecording");
    };

    RecordController.prototype._injectIntoTab = function (sTabId, sUrl) {
        if (!this.isInjected()) {
            this._sTabId = sTabId;
            this._sCurrentURL = sUrl;
            chrome.tabs.executeScript(this._sTabId, {
                file: '/scripts/content/ui5Testing.js'
            }, function () {
                if (chrome.runtime.lastError) {
                    MessageToast.show("Initialization for " + this._sCurrentURL + " failed. Please restart the Addon.");
                }
                this._bIsInjected = true;
                Communication.register(this._sTabId);
                //this._checkWindowLifecycle();
                this._oInitPromiseResolve();
            }.bind(this));
        } else {
            //we are already injected.. no need to register or do anything..
            this._bIsInjected = true;
            Communication.register(this._sTabId);
            //this._checkWindowLifecycle();
            this._oInitPromiseResolve();
        }
        //}.bind(this));
    };

    RecordController.prototype.onHandleClose = function (oEvent) {
        var aContexts = oEvent.getParameter("selectedContexts");
        this._bIsInjected = false;
        if (aContexts && aContexts.length) {
            var oObject = aContexts[0].getObject();
            this._injectIntoTab(oObject.id, oObject.url);
        } else {
            MessageToast.show("No URL was selected - no Recording will start");
            this._oInitPromiseReject();
        }
    };


    RecordController.prototype.injectScript = function (iTabId, sTabUrl) {
        var iId = iTabId;
        var sUrl = sTabUrl;
        return new Promise(function (resolve, reject) {
            this._oInitializedPromise = new Promise(function (resolve, reject) {
                this._oInitPromiseResolve = resolve;
                this._oInitPromiseReject = reject;
                if (iId && sUrl) {
                    this._injectIntoTab(iId, sUrl);
                } else {
                    chrome.tabs.query({
                        active: true,
                        currentWindow: false
                    }, function (tabs) {
                        var aData = [];
                        for (var i = 0; i < tabs.length; i++) {
                            if (iId && iId !== tabs[i].id) {
                                continue;
                            }
                            if (tabs[i].url) {
                                aData.push({
                                    url: tabs[i].url,
                                    id: tabs[i].id
                                });
                            }
                        }
                        if (aData.length === 0) {
                            MessageToast.show("There is no tab, which can be used for recording");
                            reject();
                            return;
                        }
                        if (aData.length > 1) {
                            this._oModel.setProperty("/urls", aData);
                            this._oURLPopover.open();
                        } else {
                            this._injectIntoTab(aData[0].id, aData[0].url);
                        }
                    }.bind(this));
                }
            }.bind(this));
            this._oInitializedPromise.then(resolve, function () {
                reject();
                this._oInitPromiseReject = null;
            }.bind(this));
        }.bind(this));
    };


    return {
        /**
         * Getter function for the Singleton pattern
         *
         * @returns {com.ui5.testing.model.RecordController} the RecordController instance
         */
        getInstance: function () {
            if (!oInstance) {
                oInstance = new RecordController();
            }
            return oInstance;
        }
    };
});
