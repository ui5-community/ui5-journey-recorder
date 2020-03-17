sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox"
], function (SuperObject, MessageBox) {
    "use strict";
    var oInstance;
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
            chrome.runtime.sendMessage({type: "handshake-get-window-id"}, function (response) {
                if (response && response.type === "handshake-send-window-id") {
                    this._iWindowId = response.windowId;
                    this._bStartImmediately = response.startImmediately;
                }
            }.bind(this));

            //<SuperObject>.call(this) <-- Inheritance call constructor super class
        },

        /**
         *
         * @param {*} sTabId
         */
        establishConnection: function (sTabId) {
            return new Promise(function (resolve, reject) {
                /**
                 * Event handler for the page message to set the connection status between page and extension
                 *
                 * @param {string} sChannelId the channel we are on
                 * @param {string} sEventId  the event we are reacting on
                 * @param {object} oData the carrier data for the event
                 */
                function fnCallback(sChannelId, sEventId, oData) {
                    sap.ui.getCore().getEventBus().unsubscribe("Internal", "injectDone", fnCallback);

                    if (oData.status === "success") {
                        resolve(oData);
                    } else {
                        this.resetConnection();
                        reject(oData);
                    }
                }

                sap.ui.getCore().getEventBus().subscribe("Internal", "injectDone", fnCallback.bind(this));

                if (!this._sTabId) {
                    this._sTabId = sTabId;

                    chrome.tabs.executeScript(this._sTabId, {
                        file: '/scripts/content/contentInject.js'
                    });
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
        isConnected: function() {
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
         * Handle all incomming message from the injection, for the current active port.
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
         * Resets the connection.
         */
        _onDisconnect: function () {
            this.resetConnection();
            // publish appropriate event to event bus
            sap.ui.getCore().getEventBus().publish("Internal", "pageDisconnected");
        },

        /**
         * Sends a message to the page
         *
         * @param {object} oInformation
         */
        _sendMessage: function (oInformation) {
            this._port.postMessage(oInformation);
        },

        /**
         * Sends a synchronous handled message to the page.
         *
         * @param {object} oInformation
         *
         * @returns {Promise}
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
         * Sends a asynchronous message to the UI5-Page
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
});
