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

    var _iUUIDSuffix = 0;

    /**
     *
     */
    function _uuidv4() {
        var sStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }) + _iUUIDSuffix++;
        return sStr;
    }

    var RecordController = UI5Object.extend("com.ui5.testing.model.RecordController", /** @lends com.ui5.testing.model.RecordController.prototype */ {

        constructor: function () {
            this.reset();

            sap.ui.getCore().getEventBus().subscribe("Internal", "recordingStopped", this._onStopped.bind(this));

            // trigger prompt on unload!
            window.addEventListener('beforeunload', function (e) {
                // cancel the event
                e.preventDefault();
                // set 'returnValue' as required by Chrome
                e.returnValue = '';
            });
        },

        /**
         * Reset the RecordController to defaults.
         */
        reset: function () {

            if (!this._oModel) {
                this._oModel = new JSONModel();
            }

            var oJSON = {
                isRecording: false,
                item: {},
                elements: [],
                elementLength: 0,
                test: {
                    uuid: 0,
                    createdAt: 0
                }
            };
            this._oModel.setData(oJSON);
        },

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
                                Connection.getInstance().resetConnection();
                                resolve();
                            }.bind(this));
                        }.bind(this));
                    } else {
                        return new Promise(function () { });
                    }
                }.bind(this)
            }
            );
        },

        getModel: function () {
            return this._oModel;
        },

        setSelectedItem: function (oItem) {
            this._oModel.setProperty("/item", oItem);
        },

        getSelectedItem: function () {
            return this._oModel.getProperty("/item");
        },

        getTestElements: function () {
            return this._oModel.getProperty("/elements");
        },

       /**
         *
         * @param {string|integer} idx the index to obtain from the test elements
         */
        getTestElementById: function (idx) {
            return this._oModel.getProperty("/elements/" + idx);
        },

        /**
         *
         * @param {string|integer} idx the index to remove from the test elements
         */
        removeTestElementById: function (idx) {
            var aElements = this.getTestElements();
            aElements.splice(idx, 1);
            this.setTestElements(aElements);
        },

        setTestElements: function (aElements) {
            this._oModel.setProperty("/elements", aElements);
            this._oModel.setProperty("/elementLength", aElements.length);
        },

        getTestDetails: function () {
            return this._oModel.getProperty("/test");
        },

        setTestDetails: function (oTestDetails) {
            this._oModel.setProperty("/test", oTestDetails);
        },

        initializeTestDetails: function () {
            this._oModel.setProperty("/test", {
                uuid: _uuidv4(),
                createdAt: new Date().getTime()
            });
        },

        getTestUUID: function () {
            return this._oModel.getProperty("/test/uuid");
        },

        isTestStepExecuted: function (iStepID) {
            return this._oModel.getProperty("/elements/" + iStepID + "/stepExecuted") === true;
        },

        /**
         *
         * // FIXME the current ID should be hold by the RecordController!
         *
         * @param {string|integer} idx
         */
        showPlayOnTestElementById: function (idx) {

            if (!idx) {
                return;
            }

            var iNumElements = this._oModel.getProperty("/elementLength");
            for (var i = 0; i < iNumElements; i++) {
                this._oModel.setProperty("/elements/" + i + "/showPlay", i === idx);
            }
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
            if (this.isRecording()) {
                ConnectionMessages.stopRecording(Connection.getInstance())
                    .then(function () {
                        ConnectionMessages.unlockPage(Connection.getInstance());
                        this._onStopped();
                    }.bind(this));
            }
        },

        _onStopped: function () {
            this._oModel.setProperty("/isRecording", false);
        },

        isInjected: function () {
            return Connection.getInstance().isConnected();
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
