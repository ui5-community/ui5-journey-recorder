(function () {
    "use strict";

    /**
     * ConnectionProxy class to handle any page–extension messaging.
     *
     * This class is singleton to only allow one port per page.
     *
     * Messages between the proxy and the extension are handled using a {@link chrome.runtime.Port}.
     * Messages between the proxy and the page are handled using a {@link window.message} and appropriate
     */
    class ConnectionProxy {

        static _oInstance;

        /**
         * Obtain the singleton instance of this class.
         *
         * @returns {ConnectionProxy} the singleton instance
         */
        static getInstance() {
            if (!ConnectionProxy._oInstance) {
                ConnectionProxy._oInstance = new ConnectionProxy();
            }

            return ConnectionProxy._oInstance;
        }

        /**
         * Generate a unique injection ID.
         */
        static _generateInjectID() {
            console.log('- Generating injection id');
            var sInjectId = 'xxxyxxxy'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            return sInjectId;
        }

        /**
         * Start connection by opening ports and application of listeners.
         */
        start() {
            // open port for extension messaging
            this._openPort();

            this._port.onMessage.addListener(this._handleMessagesFromExtension.bind(this));
            window.addEventListener("message", this._handleMessagesFromPage.bind(this));
        }


        /**
         * Open the port for extension messaging.
         */
        _openPort() {
            console.log("- Create connection to extension");
            this._port = chrome.runtime.connect({
                name: ConnectionProxy._generateInjectID() + "-UI5Testrecorder"
            });
        }

        /**
         * Send message to extension.
         *
         * @param {string} sType the message type/label
         * @param {object} oCarrierData the data of the message
         */
        sendToExtension(sType, oCarrierData) {
            this._port.postMessage({
                type: sType,
                data: oCarrierData
            });
        }

        /**
         * Listener function for messages from the extension,
         * to be forwarded to the page.
         *
         * @param {object} oMessage the message information from the extension to the page.
         */
        _handleMessagesFromExtension(oMessage) {
            this.sendToPage(oMessage.action, oMessage.data);
        }

        /**
         * Send message to page.
         *
         * @param {string} sAction the action to perform on page side
         * @param {object} oCarrierData the data used to perform the action
         */
        sendToPage(sAction, oCarrierData) {
            window.postMessage({
                origin: "FROM_EXTENSION",
                type: sAction,
                data: oCarrierData
            });
        }

        /**
        * Event handler for page communication to the extension
        *
        * @param {object} oMessage the message information from the extension to the page
        */
        _handleMessagesFromPage(oMessage) {
            if (oMessage.source !== window) {
                return;
            }

            // only handle if messages are from the page
            if (oMessage.data.origin && (oMessage.data.origin === "FROM_PAGE")) {
                console.debug("Received message from page.");

                // handle messages by their type
                switch (oMessage.data.type) {

                    // page injection is completed
                    case "inject-init":

                        // UI5 found on page
                        if (oMessage.data.data.ui5) {
                            console.log('Finished setup, inform extension about success!');

                            // inject CSS
                            PageInjector.injectCSS();

                            // send success message to extension
                            this.sendToExtension(
                                "success",
                                {
                                    reason: "inject-init",
                                    data: {
                                        ui5: oMessage.data.data.ui5,
                                        version: oMessage.data.data.version,
                                        name: oMessage.data.data.name
                                    }
                                }
                            );
                        }
                        // *no* UI5 found on page
                        else {
                            console.log('Finished setup, inform extension about failure!');

                            // send error message to extension
                            this.sendToExtension(
                                "error",
                                {
                                    message: "No UI5 found in page, try to re-inject or make clear the page contains a UI5 version."
                                }
                            );

                            // disconnect the port to not spam the browser
                            this._port.disconnect();
                        }

                        break;

                    // by default, only relay messages to extension
                    default:

                        this.sendToExtension(
                            "information",
                            {
                                reason: oMessage.data.type,
                                data: oMessage.data.data
                            }
                        );
                } // switch (oMessage.data.type)
            } // if (oMessage.data.origin && (oMessage.data.origin === "FROM_PAGE"))
        }
    }

    /**
     * PageInjector class to statically handle page injection.
     *
     * This class only contains static methods to handle injections.
     */
    class PageInjector {

        /**
         * Inject the JS part of the page injection (i.e., {@file /scripts/injected/pageInject.js}).
         */
        static injectJS() {
            console.log("- Inject page script and wait until UI5 is loaded");
            var script = document.createElement('script');
            script.id = "ui5-testrecorder-functions";
            script.src = chrome.extension.getURL('/scripts/injected/pageInject.js');
            script.defer = "defer";
            var head = document.head;
            head.appendChild(script);
        }

        /**
         * Inject the CSS part of the page injection (i.e., {@file /scripts/injected/pageInject.css}).
         */
        static injectCSS() {
            //add the UI5-Testrecorder formatting
            var link = document.createElement('link');
            link.id = "testing_ui5";
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = chrome.extension.getURL('/scripts/injected/pageInject.css');
            link.media = 'all';
            document.head.appendChild(link);
        }
    }

    // open connections and inject JS
    ConnectionProxy.getInstance().start();
    PageInjector.injectJS();

}());
