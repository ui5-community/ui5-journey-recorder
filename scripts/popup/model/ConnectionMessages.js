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
    }

    return ConnectionMessages;
});
