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
            chrome.runtime.onConnect.addListener(this._handleIncommingConnections.bind(this));
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

                console.log("Create connection");
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
            this._port = null;
            this._oMessageMap = {};
            this._iMessageID = 0;
        },

        /**
         * Handle incomming connection and adjusts the port listening to
         *
         * @param {chrome.runtime.Port} port the port which is calling
         */
        _handleIncommingConnections: function (port) {
            console.log('connection incomming');
            if (!this._port) {
                this._port = port;
                this._port.onDisconnect.addListener(function () {
                    this.resetConnection();
                    MessageBox.information("Connection to the webpage lost, try to reconnect.");
                }.bind(this));
                this._port.onMessage.addListener(this._handleIncommingMessage.bind(this));
            } else {
                MessageBox.alert("There is already a connection, please stop before opening a new one");
            }
        },

        /**
         * Handle all incomming message from the injection, for the current active port.
         *
         * @param {object} oMsg the message send from the injected code.
         */
        _handleIncommingMessage: function (oMsg) {
            if (oMsg.data.messageID) {
                this._oMessageMap[oMsg.data.messageID].success(oMsg.data.data);
                console.log("MessageIncomming: ", JSON.stringify(oMsg));
            } else {
                sap.ui.getCore().getEventBus().publish("Internal", oMsg.data.reason, oMsg.data.data);
                console.log("How to use async message?", JSON.stringify(oMsg));
            }
        },

        /**
         * Sends a message to the page
         *
         * @param {object} oInformation
         */
        _sendMessage: function (oInformation) {
            this._port.postMessage(oInformation);
        },

        //test for "promised-Request"
        /**
         * Sends a synchronous handled message to the page.
         *
         * @param {object} oInformation
         */
        syncMessage: function (oInformation) {
            var oSyncronizer = {};
            if (typeof oInformation.success === "function") {
                oSyncronizer.success = oInformation.success;
            } else {
                console.warn("oInformation.success is not a function, therefore it will be ignored.");
            }
            if (typeof oInformation.error === "function") {
                oSyncronizer.error = oInformation.error;
            } else {
                console.warn("oInformation.error is not a function, therefore it will be ignored.");
            }
            oInformation.messageID = ++this._iMessageID;
            oSyncronizer.messageID = oInformation.messageID;
            this._oMessageMap[oInformation.messageID] = oSyncronizer;
            this._sendMessage(oInformation);
        },

        /**
         * Sends a asynchronous message to the UI5-Page
         *
         * @param {object} oInformation the information which should be send to the page
         */
        asyncMessage: function (oInformation) {
            this._sendMessage(oInformation);
        },

        getWindowInfo: function (fFunc) {
            this.syncMessage({
                action: "getWindowInfo",
                success: fFunc
            });
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
