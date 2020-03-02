/* eslint-disable require-jsdoc */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "com/ui5/testing/model/GlobalSettings",
    "com/ui5/testing/model/Utils",
    "sap/m/MessageBox"
], function (UI5Object, JSONModel, Connection, ConnectionMessages, GlobalSettings, Utils, MessageBox) {
    "use strict";

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
         *
         * @param {boolean} bDisconnect flag whether to disconnect also from the tab
         */
        reset: function (bDisconnect) {
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
                isExecuting: false,
                currentReplayStep: 0,
                replayInterval: 0,
                replayMessages: []
            };
            this._oModel.setData(oJSON);

            // disconnect?
            if (bDisconnect) {
                Connection.getInstance().resetConnection();
            }
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

            ConnectionMessages.lockPage(Connection.getInstance());
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

            ConnectionMessages.unlockPage(Connection.getInstance());
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
         *
         * The user is asked whether to close the currently associated tab is to be closed.
         *
         * @returns {Promise} promise whether the tab closing worked or not
         */
        closeTab: function () {
            return new Promise(function (resolve, reject) {

                if (this.isInjected()) {

                    MessageBox.show(
                        "The test recorder is already connected to a tab. This may be the case because you have been recording or replaying. " +
                        "To replay reliably, a new tab needs to be opened." +
                        "\n" +
                        "Do you want to close the already connected tab?\n" +
                        "\n" +
                        "In any case, the connected tab is disconnected. You can start recording again where you left off after replaying all steps.",
                        {
                            icon: MessageBox.Icon.QUESTION,
                            title: "Close current tab?",
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (sAction) {
                                if (sAction === MessageBox.Action.YES) {
                                    chrome.tabs.remove(Connection.getInstance().getConnectedTabId(), function () {
                                        // if an error occurred while closing the tab, do not proceed
                                        if (chrome.runtime.lastError) {
                                            reject();
                                        }
                                        else {
                                            resolve();
                                        }
                                    });
                                } else {
                                    // resolve in any case
                                    resolve();
                                }
                            }
                        }
                    );

                } else {
                    resolve();
                }

            }.bind(this));
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
        _setRecording: function (bIsRecording = true) {
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
                uuid: Utils.getUUIDv4(),
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
         * @param {Array<object>} aElements the list of elements under test to set
         */
        setTestElements: function (aElements) {
            // for newer versions of the test recorder (>0.5.2), the detailed assert configurations are stored for attribute-based asserts
            // as those are needed to execute such asserts properly; therefore, we need to regenerate the assert details here again for
            // test record that have been recorded using an older version of the test recorder
            aElements.forEach(function (oElement) {
                if (oElement.property.type === "ASS" && !oElement.assertion.asserts) {
                    var oAssertion = Utils.getAssertDefinition(oElement);
                    oElement.assertion.asserts = oAssertion.asserts;
                }
            });

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

            this.closeTab().then(function () {

                Connection.getInstance().resetConnection();
                this.stopReplaying();

                Utils.requestTabsPermission()
                    .then(
                        function () {
                            this._createTabAndInjectScript(sURL)
                                .then(function () {
                                    this._oModel.setProperty("/replayMessages", []);
                                    this._executeReplay();
                                }.bind(this));
                        }.bind(this)
                    )
                    .catch(function () {
                        // FIXME permission not granted, send message via event bus!
                    });

            }.bind(this));

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
            this._oModel.setProperty("/isExecuting", false);
            this._setReplaying(false);
            // TODO disconnect here?!
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
        _setReplaying: function (bIsReplaying = true) {
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
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/isExecuted", true);
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/isCurrentStep", false);
            this._oModel.setProperty("/elements/" + iStepIdx + "/replay/executionState", sState);

            // update current step index
            this._oModel.setProperty("/isExecuting", false);
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
                var bIsCurrentStep = iIndex == iCurrentStep;
                oElement.replay.isCurrentStep = bIsCurrentStep;
                if (bIsCurrentStep) {
                    oElement.replay.executionState = sap.ui.core.MessageType.Information;
                }
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
         *       isCurrentStep: false,
         *       executionState: sap.ui.core.MessageType.None
         *   };
         * </code></pre>
         *
         * @private
         */
        _resetTestElementsForReplay: function () {
            this.getTestElements().forEach(function (oElement) {
                oElement.replay = {
                    isExecuted: false,
                    isCurrentStep: false,
                    executionState: sap.ui.core.MessageType.None
                };
            });
        },

        /**
         * Replay the next step while respecting the replay interval (i.e., the timeout for the next step).
         *
         * @private
         */
        _replayNextStepWithTimeout: function () {
            var iReplayInterval = this._settingsModel.getProperty("/settings/defaultReplayInterval");
            this._oModel.setProperty("/replayInterval", iReplayInterval);

            if (this.isReplaying() && iReplayInterval !== 0) {
                setTimeout(() => {
                    this.replayNextStep();
                }, 500 * iReplayInterval);
            }
        },

        /**
         * Replay the next step in the recording without delay.
         */
        replayNextStep: function () {

            var iCurrentStepIdx = this._oModel.getProperty("/currentReplayStep");
            var oElement = this.getTestElementByIdx(iCurrentStepIdx);

            // focus the target window so the user can see what is going on
            this.focusTargetWindow();

            // indicate to bindings that a step is executing now
            this._oModel.setProperty("/isExecuting", true);

            // execute the next replay action and react to result
            this.executeTestStep(oElement).then(function (oResult) {

                // react only if there is a result
                if (oResult && oResult.result) {
                    switch (oResult.result) {
                        case "success":
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Success);
                            break;
                        case "warning":
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Warning);
                            break;
                        case "error":
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Error);
                            this.stopReplaying();
                            break;
                        default:
                            this.setTestStepExecuted(iCurrentStepIdx, sap.ui.core.MessageType.Error);
                            this.stopReplaying();
                            break;
                    }

                    // publish any messages from the result
                    this._oModel.setProperty("/replayMessages", this._oModel.getProperty("/replayMessages").concat(oResult.messages));

                    // stop replaying if no steps left and announce that (i.e., no error occurred yet!)
                    if (this.isReplaying() && iCurrentStepIdx >= this.getTestElements().length - 1) {
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

                    // publish any messages from the result
                    var oMessage = {
                        type: "Error",
                        title: "Replay error",
                        subtitle: "Test step returned no processable result",
                        description: "No processable result was returned for the test step executed last. Stopping..."
                    }
                    this._oModel.getProperty("/replayMessages").push(oMessage);
                    this._oModel.updateBindings(true); // force update as the array push in the previous line does not trigger one

                    this.stopReplaying();
                }

            }.bind(this));
        },

        /**
         * Execute the action/assert in the given test step.
         *
         * @param {object} oTestStep the test step to be executed (e.g., obtained via 'getTestElementByIdx')
         *
         * @returns {Promise} a promise with the result of the execution
         */
        executeTestStep: function (oTestStep) {
            var iTimeout = this._settingsModel.getProperty("/settings/defaultReplayTimeout");

            return new Promise(function (resolve) {

                // actions
                if (oTestStep && oTestStep.property.type === "ACT") {
                    ConnectionMessages.executeAction(Connection.getInstance(), {
                        element: oTestStep,
                        timeout: iTimeout
                    }).then(function (oData) {
                        resolve(oData);
                    });
                } else
                // asserts
                if (oTestStep && oTestStep.property.type === "ASS") {
                    ConnectionMessages.executeAssert(Connection.getInstance(), {
                        element: oTestStep.selector.selectorAttributes,
                        assert: oTestStep.assertion
                    }).then(function (oData) {
                        resolve(oData);
                    });
                } else
                // support assistant
                if (oTestStep && oTestStep.property.type === "SUP") {
                    ConnectionMessages.runSupportAssistant(Connection.getInstance(), {
                        component: oTestStep.item.metadata.componentName,
                        rules: oTestStep.property.supportAssistant
                    }).then(function (oData) {
                        // store the result data within the test step so it can be retrieved later
                        oTestStep.supportAssistantResult = oData;
                        // resolve
                        resolve(oData);
                    });
                }
                // everything else cannot be handled and is consequently returned right away
                else {
                    resolve({
                        result: "error",
                        messages: []
                    });
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
