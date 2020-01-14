sap.ui.define([], function () {
    "use strict";

    class ConnectionMessages {

        /**
         *
         * @param {com.ui5.testing.model.Connection} connection the connection to use for sending messages
         */
        static getWindowInfo(oConnection) {
            return oConnection.syncMessage({
                action: "getWindowInfo"
            });
        }

        /**
         *
         * @param {com.ui5.testing.model.Connection} connection the connection to use for sending messages
         * @param {object} oInformation parameters for the start message
         */
        static startRecording(oConnection, oInformation) {
            return oConnection.syncMessage({
                action: "startRecording",
                data: oInformation
            });
        }

        /**
         *
         * @param {com.ui5.testing.model.Connection} connection the connection to use for sending messages
         */
        static stopRecording(oConnection) {
            return oConnection.syncMessage({
                action: "stopRecording"
            });
        }

        /**
         *
         * @param {com.ui5.testing.model.Connection} connection the connection to use for sending messages
         * @param {object} oItemSelector selector information
         */
        static findElements(oConnection, oItemSelector) {
            return oConnection.syncMessage({
                action: "findItemsBySelector",
                data: oItemSelector
            });
        }

        /**
         *
         * @param {com.ui5.testing.model.Connection} connection the connection to use for sending messages
         * @param {object} oInformation parameters for the execute message
         */
        static executeAction(oConnection, oInformation) {
            return oConnection.syncMessage({
                action: "executeAction",
                data: oInformation
            });
        }

        /**
         *
         * @param {com.ui5.testing.model.Connection} connection the connection to use for sending messages
         */
        static unlockPage(oConnection) {
            return oConnection.syncMessage({
                action: "unlockPage"
            });
        }

    }

    return ConnectionMessages;
});
