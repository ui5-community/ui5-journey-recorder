sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox"
], function (SuperObject, MessageBox) {
    "use strict";

    var Connection = SuperObject.extend("com.ui5.testing.model.Connection", /** @lends com.ui5.testing.model.Connection.prototype */ {

        /**
         * Constructor for the Connection object
         */
        constructor: function () {
            this.resetConnection();
            chrome.runtime.onConnect.addListener(this._handleIncomingConnections.bind(this));

            // get window info for popup window
            this._iWindowId = null;
            this._bStartImmediately = false;
            chrome.runtime.sendMessage({
                type: "handshake-get-window-id"
            }, function (response) {
                if (response && response.type === "handshake-send-window-id") {
                    this._iWindowId = response.windowId;
                    this._bStartImmediately = response.startImmediately;
                }
            }.bind(this));

            //<SuperObject>.call(this) <-- Inheritance call constructor super class
        },

        /**
         * Establish a connection to the tab with the given ID.
         *
         * @param {string|integer} sTabId the ID of the tab to connect to
         *
         * @returns {Promise} a Promise indicating the connection
         */
        establishConnection: function (sTabId) {
            return new Promise(function (resolve, reject) {

                // flag whether an injection is attempted already, so we do not perform actions several times,
                // especially the injection script can break things
                var bInjectionAttempted = false;

                /**
                 * Event handler for 'chrome.tabs.onUpdated' to check for the to-be-connected page to reloaded
                 * and to inject the content script afterwards.
                 *
                 * Note: This function is triggered for all updates on tabs, not just the connected tab.
                 *
                 * @param {integer} iTabId the ID of the tab that was updated
                 */
                function fnAttemptInjectionAfterReload(iTabId) {
                    // check for correct tab and information
                    if (!bInjectionAttempted) {
                        // state that an injected is attempted so that no further ones are performed
                        bInjectionAttempted = true;
                        // perform the injection after some seconds
                        chrome.tabs.executeScript(iTabId, {
                            file: '/scripts/content/contentInject.js'
                        }, function () {
                            // remove the listener after the attempt so that it is not triggered for any further
                            // tab updates (later, somewhere else, ...)
                            chrome.tabs.onUpdated.removeListener(fnAttemptInjectionAfterReload);
                        });
                    }
                }

                /**
                 * Event handler for the page message to resolve the connection status between page and extension
                 *
                 * @param {string} sChannelId the channel we are on
                 * @param {string} sEventId  the event we are reacting on
                 * @param {object} oData the carrier data for the event
                 */
                function fnInjectDoneCallback(sChannelId, sEventId, oData) {
                    sap.ui.getCore().getEventBus().unsubscribe("Internal", "injectDone", fnInjectDoneCallback);

                    if (oData.status === "success") {
                        resolve(oData);
                    } else {
                        this.resetConnection();
                        reject(oData);
                    }
                }

                if (!this._sTabId) {
                    this._sTabId = sTabId;


                    sap.ui.getCore().getEventBus().subscribe("Internal", "injectDone", fnInjectDoneCallback.bind(this));

                    //this here was reloading the page - i do not see that as required - better solve the actual root cause..
                    //reloading otherwise might cause issues e.g. within reports (lumira or similar)
                    fnAttemptInjectionAfterReload(this._sTabId);
                } else {
                    reject({
                        message: "There is already a connection, please stop before opening a new one."
                    });
                }
            }.bind(this));
        },

        /**
         * Reset the connection such that a new one can be established.
         */
        resetConnection: function () {
            this._sTabId = "";
            if (this.isConnected()) {
                this._port.disconnect();
            }
            this._port = null;
            this._oMessageMap = {};
            this._iMessageID = 0;
        },

        /**
         * Check whether the connection is established.
         *
         * @returns {boolean} true if the connection is established, false otherwise
         */
        isConnected: function () {
            return !!this._port;
        },

        /**
         * Handle incoming connection and adjusts the port listening to
         *
         * @param {chrome.runtime.Port} port the port which is calling
         */
        _handleIncomingConnections: function (port) {
            if (!this.isConnected()) {
                this._port = port;
                this._port.onDisconnect.addListener(this._onDisconnect.bind(this));
                this._port.onMessage.addListener(this._handleIncomingMessage.bind(this));
            } else {
                // TODO publish appropriate event to event bus instead of showing message box
                MessageBox.warning("There is already a connection, please stop before opening a new one.");
            }
        },

        /**
         * Handle all incoming message from the injection, for the current active port.
         *
         * @param {object} oMsg the message send from the injected code.
         */
        _handleIncomingMessage: function (oMsg) {
            if (oMsg.data.messageID && this._oMessageMap[oMsg.data.messageID]) {
                this._oMessageMap[oMsg.data.messageID].resolve(oMsg.data.data);
            } else {
                sap.ui.getCore().getEventBus().publish("Internal", oMsg.data.reason, oMsg.data.data);
            }
        },

        /**
         * Reset the connection.
         */
        _onDisconnect: function () {
            this.resetConnection();
            // publish appropriate event to event bus
            sap.ui.getCore().getEventBus().publish("Internal", "pageDisconnected");
        },

        /**
         * Send a message through this connection.
         *
         * @param {object} oInformation the message to send
         */
        _sendMessage: function (oInformation) {
            if (this._port) {
                this._port.postMessage(oInformation);
            }
        },

        /**
         * Send a handled message to the page.
         *
         * @param {object} oInformation the message to send
         *
         * @returns {Promise} a Promise fulfilled with the returning answer to the sent message
         */
        syncMessage: function (oInformation) {
            var oSynchronizer = {};

            oInformation.messageID = ++this._iMessageID;
            var oReturn = new Promise(function (resolve, reject) {
                oSynchronizer.resolve = resolve;
                oSynchronizer.reject = reject;
                this._sendMessage(oInformation);
            }.bind(this));

            this._oMessageMap[oInformation.messageID] = oSynchronizer;

            return oReturn;
        },

        /**
         * Send a message to the page that does *not* expect an answer.
         *
         * @param {object} oInformation the information which should be send to the page
         */
        asyncMessage: function (oInformation) {
            this._sendMessage(oInformation);
        },

        /**
         * Get the ID of the tab to which this connection points to.
         *
         * @returns {integer} the tab's ID
         */
        getConnectedTabId: function () {
            return this._sTabId;
        },

        /**
         * Get the window ID of the popup.
         *
         * @returns {integer} the window's ID
         */
        getConnectingWindowId: function () {
            return this._iWindowId;
        },

        /**
         * Get the flag whether this is an immediate start or not.
         *
         * @returns {boolean} start immediately?
         */
        isStartImmediately: function () {
            return this._bStartImmediately;
        },

        /**
         * Set the flag whether this is an immediate start or not.
         *
         * @param {boolean} bStartImmediately start immediately?
         */
        setStartImmediately: function (bStartImmediately) {
            this._bStartImmediately = bStartImmediately;
        }
    });

    // #region Singleton

    /**
     * Singleton instance of the Connection.
     */
    var oInstance;

    return {
        /**
         * Getter function for the Singleton pattern
         *
         * @returns {com.ui5.testing.model.Connection} the Connection instance
         */
        getInstance: function () {
            if (!oInstance) {
                oInstance = new Connection();
            }
            return oInstance;
        }
    };

    // #endregion

});