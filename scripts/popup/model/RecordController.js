/* eslint-disable require-jsdoc */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (UI5Object, JSONModel, Connection, ConnectionMessages, MessageToast, MessageBox) {
    "use strict";

    /**
     * Singleton instance for RecordController
     */
    var oInstance;

    var RecordController = UI5Object.extend("com.ui5.testing.model.RecordController", /** @lends com.ui5.testing.model.RecordController.prototype */ {

        constructor: function () {
            var oJSON = {
                recording: false
            };
            this._oModel = new JSONModel(oJSON);
            this._bIsInjected = false;

            sap.ui.getCore().getEventBus().subscribe("Internal", "recordingStopped", this._onStopped.bind(this));
        },

        // FIXME add reset functionality!

        /**
         * Focus the popup.
         */
        focusPopup: function () {
            var iWindowId = Connection.getInstance().getConnectingWindowId();
            if (iWindowId) {
                console.debug("changing to window: " + iWindowId)
                chrome.windows.update(iWindowId, {
                    focused: true
                });
            }
        },

        /**
         * Focus the target window.
         */
        focusTargetWindow: function () {
            chrome.tabs.update(
                Connection.getInstance().getConnectedTabId(),
                {
                    active: true
                },
                function (tab) {
                    // also focus the window of this tab!
                    chrome.windows.update(tab.windowId, {
                        focused: true
                    });
                }
            );
        },

        closeTab: function () {
            MessageBox.show(
                "You closed the session, the tab involved also?", {
                icon: MessageBox.Icon.QUESTION,
                title: "Close current Tab?",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        return new Promise(function (resolve, reject) {
                            chrome.tabs.remove(Connection.getInstance().getConnectedTabId(), function () {
                                if (chrome.runtime.lastError) {
                                    reject();
                                }
                                this._bIsInjected = false;
                                Connection.getInstance().resetConnection();
                                resolve();
                            }.bind(this));
                        }.bind(this));
                    } else {
                        return new Promise(function () {});
                    }
                }.bind(this)
            }
            );
        },

        getModel: function () {
            return this._oModel;
        },

        startRecording: function () {
            var bStartForControl = Connection.getInstance().isStartImmediately();
            Connection.getInstance().setStartImmediately(false); // disable consecutive immediate starts

            // send word to the injection that recording starts
            ConnectionMessages.startRecording(
                Connection.getInstance(),
                {
                    startImmediate: bStartForControl ? bStartForControl : false
                }
            ).then(function () {
                this._oModel.setProperty("/isRecording", true);
                if (bStartForControl !== true) {
                    this.focusTargetWindow();
                }
            }.bind(this));
        },

        stopRecording: function () {
            if (this._oModel.getProperty("/isRecording") === true) {
                ConnectionMessages.stopRecording(Connection.getInstance())
                .then(function() {
                    ConnectionMessages.unlockPage(Connection.getInstance());
                });
                this._onStopped();
            }
        },

        _onStopped: function () {
            this._oModel.setProperty("/isRecording", false);
            this._bIsInjected = false;
        },

        isInjected: function () {
            return this._bIsInjected;
        },

        isRecording: function () {
            return this._oModel.getProperty("/isRecording");
        }

    });

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
