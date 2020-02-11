/* eslint-disable require-jsdoc */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "com/ui5/testing/model/GlobalSettings",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (UI5Object, JSONModel, Connection, ConnectionMessages, GlobalSettings, MessageToast, MessageBox) {
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
            // store global settings
            this._settingsModel = GlobalSettings.getModel();

            // initialize model if not existing
            if (!this._oModel) {
                this._oModel = new JSONModel();
            }

            // override already initialized model
            var oJSON = {
                // Recording
                isRecording: false,
                // Test details and elements
                test: {
                    uuid: 0,
                    createdAt: 0
                },
                item: {},
                elements: [],
                // Replaying
                isReplaying: false,
                currentReplayStep: 0
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
         *
         * @private
         */
        _createTabAndInjectScript: function (sURL) {
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
            this._resetReplaying();

            var bStartForControl = Connection.getInstance().isStartImmediately();
            Connection.getInstance().setStartImmediately(false); // disable consecutive immediate starts

            // send word to the injection that recording starts
            ConnectionMessages.startRecording(
                Connection.getInstance(),
                {
                    startImmediate: bStartForControl ? bStartForControl : false
                }
            ).then(function () {
                this._setRecording();
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
         * Set the state of recording: true for starting, false for stopping.
         *
         * If true is given (i.e., starting recording), also replaying is stopped.
         *
         * @param {boolean} bIsRecording flag whether to start or stop recording
         *
         * @private
         */
        _setRecording: function(bIsRecording = true) {
            this._oModel.setProperty("/isRecording", bIsRecording);
            if (bIsRecording) {
                this._setReplaying(false);
            }
        },

        /**
         * Event handling of the event 'recordingStopped'.
         *
         * @see RecordController.constructor
         * @private
         */
        _onRecordingStopped: function () {
            this._setRecording(false);
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
         * Start replaying by opening a new tab with the given URL, while stopping any current recording.
         *
         * @param {string} sURL the URL to open for the replay
         */
        startReplaying: function (sURL) {

            // first, stop any recording, so we do not break anything
            this.stopRecording();

            // check whether there is a connection already
            if (this.isInjected()) {

                this.closeTab().then(function () {

                    // TODO what do we need to reset here?
                    Connection.getInstance().resetConnection();
                    this.stopReplaying();

                    chrome.permissions.request({
                        permissions: ['tabs'],
                        origins: [sURL]
                    }, function (granted) {
                        if (granted) {
                            this._createTabAndInjectScript(sURL)
                                .then(function () {
                                    this._executeReplay();
                                }.bind(this));
                        }
                    }.bind(this));

                }.bind(this));

            } else {

                chrome.permissions.request({
                    permissions: ['tabs'],
                    origins: [sURL]
                }, function (granted) {

                    if (granted) {
                        this._createTabAndInjectScript(sURL)
                        .then(function () {
                            this._executeReplay();
                        }.bind(this));
                    }

                }.bind(this));
            }

        },

        /**
         * Execute the replay by initializing the model properly and triggering any potential first step.
         *
         * @private
         */
        _executeReplay: function () {
            // reset state of all recorded elements
            this._resetTestElementsForReplay();
            // reset replay state
            this._oModel.setProperty("/currentReplayStep", 0);
            this._setReplaying(true);
            this._updateCurrentStepIndicator();

            // automatically start replay if enabled and possible
            this._replayNextStepWithTimeout();
        },

        /**
         * Stop replaying.
         */
        stopReplaying: function () {
            this._setReplaying(false);
        },

        /**
         * Resets the model parts belonging to the replay functionality and stops replaying.
         *
         * @private
         */
        _resetReplaying: function () {
            this._resetTestElementsForReplay();
            this.stopReplaying();
        },

        /**
         * Return the current state of replaying.
         *
         * @returns {boolean} true if currently replaying, false otherwise
         */
        isReplaying: function () {
            return this._oModel.getProperty("/isReplaying");
        },

        /**
         * Set the state of replaying: true for starting, false for stopping.
         *
         * If true is given (i.e., starting replay), also recording is stopped.
         *
         * @param {boolean} bIsReplaying flag whether to start or stop replaying
         *
         * @private
         */
        _setReplaying: function(bIsReplaying = true) {
            this._oModel.setProperty("/isReplaying", bIsReplaying);
            if (bIsReplaying) {
                this._setRecording(false);
            }
        },

        /**
         * Check whether the test step with the given index has been executed already.
         *
         * @param {integer|string} iStepIdx the step to check by index
         *
         * @returns {boolean} true if the step at the given index has been executed already, false otherwise
         */
        isTestStepExecuted: function (iStepIdx) {
            return this._oModel.getProperty("/elements/" + iStepIdx + "/replay/isExecuted");
        },

        /**
         * Set the execution state of the the test step with the given index.
         *
         * The test step is explicitly marked as executed.
         *
         * @param {integer|string} iStepIdx the step by index to modify
         * @param {string} sState one of sap.ui.core.MessageType.*, indicating the state of the execution
         */
        setTestStepExecuted: function (iStepIdx, sState) {
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/isExecuting", false);
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/isExecuted", true);
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/isCurrentStep", false);
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/executionState", sState);

            // update current step index
            this._oModel.setProperty("/currentReplayStep", this._oModel.getProperty("/currentReplayStep") + 1);
            this._updateCurrentStepIndicator();
        },

        /**
         * Update the indicator for the current step (i.e., the path 'replay/isCurrentStep' for the current element).
         *
         * @private
         */
        _updateCurrentStepIndicator: function () {
            // do not do anything if not replaying
            if (!this.isReplaying()) {
                return;
            }

            var iCurrentStep = this._oModel.getProperty("/currentReplayStep");

            this.getTestElements().forEach(function (oElement, iIndex) {
                oElement.replay.isCurrentStep = iIndex == iCurrentStep;
            });

            // ensure that all changes are synchronized with bindings
            this._oModel.updateBindings(true);
        },

        /**
         * Reset the test elements to a state right before replay.
         *
         * This explicitly adds/resets the property 'replay' of all test elements as follows:
         * <pre><code>
         *   replay = {
         *       isExecuted: false,
         *       isExecuting: false,
         *       isCurrentStep: false,
         *       executionState: sap.ui.core.MessageType.None
         *   };
         * </code></pre>
         *
         * @private
         */
        _resetTestElementsForReplay: function() {
            this.getTestElements().forEach(function(oElement) {
                oElement.replay = {
                    isExecuted: false,
                    isExecuting: false,
                    isCurrentStep: false,
                    executionState: sap.ui.core.MessageType.None
                };
            });
        },

        /**
         * Replay the next step while respecting the replay type (i.e., the timeout for the next step).
         *
         * @private
         */
        _replayNextStepWithTimeout: function () {
            var iReplayType = this._settingsModel.getProperty("/settings/defaultReplayType");

            if (this.isReplaying() && iReplayType !== 0) {
                setTimeout(() => {
                    this.replayNextStep();
                }, 500 * iReplayType);
            }
        },

        /**
         * Replay the next step in the recording without delay.
         */
        replayNextStep: function () {

            var iCurrentStepIdx = this._oModel.getProperty("/currentReplayStep");

            // focus the target window so the user can see what is going on
            this.focusTargetWindow();

            // indicate to bindings that the current step is executing
            var oTestElement = this.getTestElementByIdx(iCurrentStepIdx);
            oTestElement.replay.isExecuting = true;
            this._oModel.updateBindings(true); // force update to bindings

            // execute the next replay action and react to result
            this._executeReplayStep().then(function (oResult) {

                // react only if there is a result
                if (oResult && oResult.result) {
                    switch (oResult.result) {
                        case "success":
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Success);
                            break;
                        case "warning":
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Warning);
                            MessageBox.warning('A warning was issued during replay!', {
                                title: "Replay warning",
                                details: oResult.messages && oResult.messages.length ? "<ul><li>" + oResult.messages.join("</li><li>") + "</li></ul>" : ""
                            });
                            break;
                        case "error":
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Error);
                            MessageBox.error('An action/assertion was not met!', {
                                title: "Replay error",
                                details: oResult.messages && oResult.messages.length ? "<ul><li>" + oResult.messages.join("</li><li>") + "</li></ul>" : ""
                            });
                            this.stopReplaying();
                            break;
                        default:
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Error);
                            MessageBox.error('An unknown result was returned for the current replay step.', {
                                title: "Replay error",
                                details: oResult.messages && oResult.messages.length ? "<ul><li>" + oResult.messages.join("</li><li>") + "</li></ul>" : ""
                            });
                            this.stopReplaying();
                            break;
                    }

                    // stop replaying if no steps left and announce that
                    if (iCurrentStepIdx >= this.getTestElements().length - 1) {
                        this.stopReplaying();
                        sap.ui.getCore().getEventBus().publish("Internal", "replayFinished", {});
                    } else {
                        // automatically continue replay if enabled and possible
                        this._replayNextStepWithTimeout();
                    }

                }
                // if no result is given, we need to react in a uniform way: stop replaying
                else {
                    this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Error);
                    MessageBox.error('No result was returned for the current replay step.', { title: "Replay error" });
                    this.stopReplaying();
                }

            }.bind(this));
        },

        /**
         * Execute the action/assert in the current replay step.
         *
         * @returns {Promise} a promise with the result of the execution
         *
         * @private
         */
        _executeReplayStep: function () {
            var oElement = this.getTestElementByIdx(this._oModel.getProperty("/currentReplayStep"));
            var iTimeout = this._settingsModel.getProperty("/settings/defaultReplayTimeout");

            return new Promise(function (resolve) {

                // actions
                if (oElement && oElement.property.type === "ACT") {
                    ConnectionMessages.executeAction(Connection.getInstance(), {
                        element: oElement,
                        timeout: iTimeout
                    }).then(function(oData) {
                        resolve(oData);
                    });
                } else
                // asserts
                if (oElement && oElement.property.type === "ASS") {
                    ConnectionMessages.executeAssert(Connection.getInstance(), {
                        element: oElement.selector.selectorAttributes,
                        assert: oElement.assertion
                    }).then(function (oData) {
                        resolve(oData);
                    });
                }
                // everything else cannot be handled and is consequently returned right away
                else {
                    resolve();
                    return false;
                }

            });
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
