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

    // #region Helper functions

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

    // #endregion

    // #region RecordController

    /**
     * Singleton instance for RecordController
     */

    var RecordController = UI5Object.extend("com.ui5.testing.model.RecordController", /** @lends com.ui5.testing.model.RecordController.prototype */ {

        constructor: function () {
            this.reset();

            sap.ui.getCore().getEventBus().subscribe("Internal", "recordingStopped", this._onRecordingStopped.bind(this));

            // trigger prompt on unload!
            window.addEventListener('beforeunload', function (e) {
                // cancel the event
                e.preventDefault();
                // set 'returnValue' as required by Chrome
                e.returnValue = '';
            });
        },

        /**
         * Return the model of this controller.
         *
         * // TODO insert structure of model into docs
         */
        getModel: function () {
            return this._oModel;
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
                test: {
                    uuid: 0,
                    createdAt: 0
                }
            };
            this._oModel.setData(oJSON);
        },

        // #region Window and tab management

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

        /**
         * Inject recording script into tab.
         *
         * @param {integer} iTabId the tab ID to prepare recording for
         *
         * @returns {Promise} promise whether the injection succeeded or not
         */
        injectScript: function (iTabId) {
            return Connection.getInstance().establishConnection(iTabId);
        },

        /**
         * Create a tab for the given URL and inject recording script into tab.
         *
         * @param {string} sURL the URL to open in the new tab
         *
         * @returns {Promise} a promise whether the inject worked or not
         */
        createTabAndInjectScript: function (sURL) {
            return new Promise(function (resolve, reject) {
                chrome.tabs.create({
                    url: sURL,
                    active: true
                }, function (oTab) {
                    // it is not necessary to explicitly wait for the tab being completely loaded (e.g., using the function 'tabs.onUpdated.addListener')
                    // as the script injection only happens after the page is loaded
                    // see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extensionTypes/RunAt
                    this.injectScript(oTab.id).then(resolve).catch(reject);
                }.bind(this));
            }.bind(this));
        },

        /**
         * Close the tab currently associated with the RecordController.
         */
        closeTab: function () {
            MessageBox.show(
                "You closed the session, the tab involved also?",
                {
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

        /**
         * Check whether the RecordController is currently associated with a tab.
         *
         * @returns {boolean} true if the RecordController is currently associated with a tab, false otherwise.
         */
        isInjected: function () {
            return Connection.getInstance().isConnected();
        },

        // #endregion

        // #region Recording

        /**
         * Start recording, triggering the event "startRecording".
         */
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

        /**
         * Stop recording, triggering the event "stopRecording".
         */
        stopRecording: function () {
            if (this.isRecording()) {
                ConnectionMessages.stopRecording(Connection.getInstance())
                    .then(function () {
                        ConnectionMessages.unlockPage(Connection.getInstance());
                        this._onRecordingStopped();
                    }.bind(this));
            }
        },

        /**
         * Return the current state of recording.
         *
         * @returns {boolean} true if currently recording, false otherwise
         */
        isRecording: function () {
            return this._oModel.getProperty("/isRecording");
        },

        /**
         * Event handling of the event 'recordingStopped'.
         *
         * @see RecordController.constructor
         * @private
         */
        _onRecordingStopped: function () {
            this._oModel.setProperty("/isRecording", false);
        },

        // #endregion

        // #region Test details and elements

        /**
         * Get the details of the current test recording.
         *
         * @returns {object} the test details
         */
        getTestDetails: function () {
            return this._oModel.getProperty("/test");
        },

        /**
         * Set the details of the current test recording.
         *
         * @param {object} oTestDetails the test details to set
         */
        setTestDetails: function (oTestDetails) {
            this._oModel.setProperty("/test", oTestDetails);
        },

        /**
         * Automatically initialize the details of the current test recording.
         */
        initializeTestDetails: function () {
            this._oModel.setProperty("/test", {
                uuid: _uuidv4(),
                createdAt: new Date().getTime()
            });
        },

        /**
         * Obtain the UUID of the current test recording.
         *
         * @returns {string} the current test recording's UUID
         */
        getTestUUID: function () {
            return this._oModel.getProperty("/test/uuid");
        },

        /**
         * Get the currently selected element under test.
         *
         * @returns {object} the currently selected element under test
         */
        getCurrentElement: function () {
            return this._oModel.getProperty("/item");
        },

        /**
         * Set the currently selected element under test.
         *
         * @param {object} oItem the currently selected element under test
         */
        setCurrentElement: function (oItem) {
            this._oModel.setProperty("/item", oItem);
        },

        /**
         * Get the full list of elements under test.
         *
         * @returns {Array<object>} the list of elements under test
         */
        getTestElements: function () {
            return this._oModel.getProperty("/elements");
        },

        /**
         * Obtain the test element at the given position in the list of all test elements.
         *
         * @param {string|integer} iIdx the index of the test element to obtain
         */
        getTestElementByIdx: function (iIdx) {
            return this._oModel.getProperty("/elements/" + iIdx);
        },

        /**
         * Set the full list of elements under test.
         *
         * @param {Array<object>} the list of elements under test to set
         */
        setTestElements: function (aElements) {
            this._oModel.setProperty("/elements", aElements);
        },

        /**
         * Remove the test element at the given position in the list of all test elements.
         *
         * @param {string|integer} idx the index to remove from the test elements
         */
        removeTestElementById: function (idx) {
            var aElements = this.getTestElements();
            aElements.splice(idx, 1);
            this.setTestElements(aElements);
        },

        // #endregion

        // #region Replaying

        /**
         * Check whether the test step with the given index has been executed already.
         *
         * @param {integer|string} iStepIdx the step to check by index
         *
         * @returns {boolean} true if the step at the given index has been executed already, false otherwise
         */
        isTestStepExecuted: function (iStepIdx) {
            return this._oModel.getProperty("/elements/" + iStepIdx + "/stepExecuted") === true;
        },

        /**
         * Indicate on the test element with the given index that it can be played.
         *
         * // TODO the current ID should be hold by the RecordController!
         *
         * @param {string|integer} iIdx the index of the element to set the indicator on
         */
        showPlayOnTestElementByIdx: function (iIdx) {

            if (iIdx === undefined || iIdx === null) {
                return;
            }

            this.getTestElements().forEach(function (oElement, iIndex) {
                oElement["showPlay"] = iIndex == iIdx;
            });

            // ensure that all changes are synchronized with bindings
            this._oModel.updateBindings(true);
        },

        // #endregion

    });

    // #endregion

    // #region Singleton

    /**
     * Singleton instance of the RecordController.
     */
    var oInstance;

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

    // #endregion

});
