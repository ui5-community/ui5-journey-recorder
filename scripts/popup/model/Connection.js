sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox"
], function (SuperObject, MessageBox) {
    "use strict";
    var oInstance;
    var Connection = SuperObject.extend("com.ui5.testing.model.Connection", /** @lends com.ui5.testing.model.Connection */ {
        /**
         * Constructor for the Connection object
         */
        constructor: function () {
            this._sTabId = "";
            this._port = null;
            chrome.runtime.onConnect.addListener(this._handleIncommingConnections.bind(this));
            //<SuperObject>.call(this) <-- Inheritance call constructor super class
        },

        /**
         * 
         * @param {*} sTabId 
         */
        establishConnection: function (sTabId) {
            console.log("Create connection");
            if (!this._sTabId) {
                this._sTabId = sTabId;

                chrome.tabs.executeScript(this._sTabId, {
                    file: '/scripts/content/newInject.js'
                });
            } else {
                MessageBox.alert("There is already a connection, please stop before opening a new one");
            }
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
                this._port.onDisconnect.addListener(function() {
                    this._port = null;
                    this._sTabId = "";
                    MessageBox.information("Connection to the webpage lost try to reconnect.");
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
            console.log("MessageIncomming: ");
            console.log(JSON.stringify(oMsg));
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