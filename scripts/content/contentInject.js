/* eslint-disable no-console */
(function () {
    "use strict";

    console.log('Start injection:');
    console.log('- generating inject id');
    var sInjectId = 'xxxyxxxy'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    console.log("- create connection to extension");
    var port = chrome.runtime.connect({
        name: sInjectId + "-UI5Testrecorder"
    });

    console.log("- setup page to extension communication ...");

    /***
     * Content script to extension communication START
     ***/
    /**
     * Send message to extension
     * @param {object} oCarrierData
     */
    function sendToExtension(sType, oCarrierData) {
        port.postMessage({
            type: sType,
            data: oCarrierData
        });
    }

    port.onMessage.addListener(
        /**
         * Listener function for messages from the Extension,
         * to be forwarded to the page inject.
         * @param {object} oMessage the message information from the extension to the page.
         */
        function (oMessage) {
            callPage(oMessage.action, oMessage.data);
        }
    );
    /***
     * Content script to extension communication END
     ***/


    /***
     * Content script to page inject communication START
     ***/
    window.addEventListener("message",
        /**
         * Event handler for page communication to the extension
         * @param {object} event the incomming event information
         */
        function (event) {
            if (event.source !== window) {
                return;
            }

            if (event.data.origin && (event.data.origin === "FROM_PAGE")) {
                console.log("Received message from page");
                switch (event.data.type) {
                    case "inject-init":
                        if (event.data.data.ui5) {
                            console.log('Finished setup, inform extension about success!');

                            //add the UI5-Testrecorder formatting
                            var link = document.createElement('link');
                            link.id = "testing_ui5";
                            link.rel = 'stylesheet';
                            link.type = 'text/css';
                            link.href = chrome.extension.getURL('/scripts/injected/pageInject.css');
                            link.media = 'all';
                            document.head.appendChild(link);

                            sendToExtension(
                                "success", {
                                    reason: "inject-init",
                                    data: {
                                        ui5: event.data.data.ui5,
                                        version: event.data.data.version,
                                        name: event.data.data.name
                                    }
                                });
                        } else {
                            console.log('Finished setup, inform extension about failure!');
                            sendToExtension(
                                "error", {
                                    message: "No UI5 found in page, try to re-inject or make clear the page contains a UI5 version."
                                });
                            port.disconnect();
                        }
                        break;
                    default:
                        sendToExtension(
                            "information", {
                                reason: event.data.type,
                                data: event.data.data
                            }
                        );
                }
            }
        });

    /**
     * Send request to page async
     *
     * @param {string} sAction the action to perform on page side
     * @param {object} oCarrierData the data used to perform the action
     */
    function callPage(sAction, oCarrierData) {
        window.postMessage({
            origin: "FROM_EXTENSION",
            type: sAction,
            data: oCarrierData
        });
    }
    /***
     * Content script to page inject communication END
     ***/

    console.log("- inject page script, and wait until ui5 is loaded");
    var script = document.createElement('script');
    script.id = "ui5-testrecorder-functions";
    script.src = chrome.extension.getURL('/scripts/injected/pageInject.js');
    script.defer = "defer";
    /* maybe it is not needed any more.
        script.onload = function () {
            debugger;
        }; */
    var head = document.head;
    head.appendChild(script);

}());
