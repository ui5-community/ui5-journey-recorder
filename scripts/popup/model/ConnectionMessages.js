sap.ui.define([], function () {
    "use strict";

    class ConnectionMessages {

        /**
         * Send message through the given connection to retrieve window information from the connected tab.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         *
         * @returns {Promise} a Promise resolving to the retrieved window info
         */
        static getWindowInfo(oConnection) {
            return oConnection.syncMessage({
                action: "getWindowInfo"
            });
        }

        /**
         * Send message through the given connection to start recording in the connected tab.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oInformation parameters for the start message
         *
         * @returns {Promise} a Promise resolving when recording started
         */
        static startRecording(oConnection, oInformation) {
            return oConnection.syncMessage({
                action: "startRecording",
                data: oInformation
            });
        }

        /**
         * Send message through the given connection to stop recording in the connected tab.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         *
         * @returns {Promise} a Promise resolving when recording stopped
         */
        static stopRecording(oConnection) {
            return oConnection.syncMessage({
                action: "stopRecording"
            });
        }

        /**
         * Send message through the given connection to find page elements matching the given selector.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oItemSelector selector information
         *
         * @returns {Promise} a Promise resolving to the matched page elements
         */
        static findElements(oConnection, oItemSelector) {
            return oConnection.syncMessage({
                action: "findItemsBySelector",
                data: oItemSelector
            });
        }

        /**
         * Send message through the given connection to find page element id's matching the given selector.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oItemSelector selector information
         *
         * @returns {Promise} a Promise resolving to the matche page elements
         */
        static findElementIDsBySelector(oConnection, oItemSelector) {
            return oConnection.syncMessage({
                action: "findElementIDsBySelector",
                data: oItemSelector
            });
        }

        /**
         * Send message through the given connection to select the page element matching the given selector.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oItemSelector selector information
         *
         * @returns {Promise} a Promise resolving when the selection has been done
         */
        static selectItem(oConnection, oItemSelector) {
            return oConnection.syncMessage({
                action: "selectItem",
                data: oItemSelector
            });
        }

        /**
         * Send message through the given connection to check the preconditions for an action based on the given item selector.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oItemSelector selector for the page element to check the action for
         *
         * @returns {Promise} a Promise resolving to the messages captured while checking the action
         */
        static checkAction(oConnection, oItemSelector) {
            return oConnection.syncMessage({
                action: "checkAction",
                data: oItemSelector
            });
        }

        /**
         * Send message through the given connection to execute the action defined by the given information.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oInformation parameters for the action
         *
         * @returns {Promise} a Promise resolving to the messages captured during execution of the action
         */
        static executeAction(oConnection, oInformation) {
            return oConnection.syncMessage({
                action: "executeAction",
                data: oInformation
            });
        }

        /**
         * Send message through the given connection to execute the assert defined by the given information.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oInformation parameters for the assert
         *
         * @returns {Promise} a Promise resolving to the messages captured during execution of the assert
         */
        static executeAssert(oConnection, oInformation) {
            return oConnection.syncMessage({
                action: "executeAssert",
                data: oInformation
            });
        }

        /**
         * Send message through the given connection to execute the support assistant within the page.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * @param {object} oComponent component information for the support-assistant message
         *
         * @returns {Promise} a Promise resolving to the support-assistant results
         */
        static runSupportAssistant(oConnection, oComponent) {
            return oConnection.syncMessage({
                action: "runSupportAssistant",
                data: oComponent
            });
        }

        /**
         * Send message through the given connection to lock the page in the connected tab.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         *
         * @returns {Promise} a Promise resolving when page has been locked
         */
        static lockPage(oConnection) {
            return oConnection.syncMessage({
                action: "lockPage"
            });
        }

        /**
         * Send message through the given connection to unlock the page in the connected tab.
         *
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         *
         * @returns {Promise} a Promise resolving when page has been unlocked
         */
        static unlockPage(oConnection) {
            return oConnection.syncMessage({
                action: "unlockPage"
            });
        }

        //#region mockdata

        /**
         * Send message through the given connection to unlock the page in the connected tab.
         * 
         * @param {com.ui5.testing.model.Connection} oConnection the connection to use for sending messages
         * 
         * @returns {Promise} a Promise resolving when page returns the requested models
         */
        static getODataV2Models(oConnection) {
            return oConnection.syncMessage({
                action: "getODataV2Models"
            });
        }
        //#endregion

    }

    return ConnectionMessages;
});
