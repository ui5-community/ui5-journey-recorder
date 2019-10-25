/*!
 * SAP
 * (c) Copyright 2015 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
(function e(t, n, r) {
    "use strict";

    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) {
                    return a(o, !0);
                }
                if (i) {
                    return i(o, !0);
                }
                var f = new Error("Cannot find module '" + o + "'");
                f.code = "MODULE_NOT_FOUND";
                throw f;
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }
    return s;
})({
    1: [function (require, module, exports) {
        "use strict";
        /**
         * Message passing to and from Extension - START
         */

        function messageToExtension(sType, oData) {
            window.postMessage({
                origin: "FROM_PAGE",
                type: sType,
                data: oData
            });
        }

        function messageFromExtension(oEvent) {
            //We only accept messages from ourselves
            if (oEvent.source !== window) {
                return;
            }

            if (event.data.type && (event.data.origin === "FROM_EXTENSION")) {
                console.log("Page injection received message: ");
                console.log("- type: " + oEvent.data.type);
                console.log("- data: " + JSON.stringify(oEvent.data.data));

                handleEvent(oEvent);
            }

        }

        function handleEvent(oEvent) {
            console.log('Find suitable event handling strategy');
        }
        /**
         * Message passing to and from Extension - END
         */

        /**
         * UI5-Testrecorder Page inject setup STARTUP Coding - START
         */
        function setupTestRecorderFunctions() {
            //setup listener for messages from the Extension
            window.addEventListener("message", messageFromExtension);
            setupPageListener();
            startRecording();
        }

        function ui5Check() {
            var oData = {};
            if (window.sap && window.sap.ui) {
                oData.ui5 = true;

                // Get framework version
                try {
                    oData.version = sap.ui.getVersionInfo().version;
                } catch (e) {
                    oData.version = '';
                }

                // Get framework name
                try {
                    var versionInfo = sap.ui.getVersionInfo();

                    // Use group artifact version for maven builds or name for other builds (like SAPUI5-on-ABAP)
                    var frameworkInfo = versionInfo.gav ? versionInfo.gav : versionInfo.name;

                    oData.name = frameworkInfo.indexOf('openui5') !== -1 ? 'OpenUI5' : 'SAPUI5';
                } catch (e) {
                    oData.name = 'UI5';
                }

                // Check if the version is supported
                oData.isVersionSupported = !!sap.ui.require;

            } else {
                oData.ui5 = false;
            }
            return oData;
        }

        function test() {

            console.log('- checking UI5 appearance...');
            const maxWaitTime = 3000;
            var waited = 0;
            var intvervalID = setInterval(function () {
                waited = waited + 100;
                if (waited % 500 === 0) {
                    console.log('- checking UI5 appearance...');
                }
                var oCheckData = ui5Check();
                if (oCheckData.ui5) {
                    clearInterval(intvervalID);
                    setupTestRecorderFunctions();
                    messageToExtension("inject-init", oCheckData);
                } else if (waited > maxWaitTime) {
                    clearInterval(intvervalID);
                    messageToExtension("inject-init", oCheckData);
                }
            }, 100);
        }
        /**
         *  UI5-Testrecorder Page inject setup STARTUP Coding - END
         */

        /**
         * UI5-Testrecorder Page Inject functional coding - START
         */
        var _bActive = false,
            _bScreenLocked = false,
            _bStarted = false,
            _oDialog = null;

        function startRecording() {
            _bActive = true;
            _bStarted = true;
        }

        function setupPageListener() {
            /** use the css hovering class */
            document.onmouseover = function (e) {
                if (_bActive === false) {
                    return;
                }
                var e = e || window.event,
                    el = e.target || e.srcElement;
                el.classList.add("ElementReveal");
            };

            document.onmouseout = function (e) {
                if (!_oDialog || !_oDialog.isOpen()) {
                    var e = e || window.event,
                        el = e.target || e.srcElement;
                    el.classList.remove("ElementReveal");
                }
            };

            document.onclick = function (e) {
                var e = e || window.event,
                    el = e.target || e.srcElement;

                if (_bActive === false) {
                    //no active recording, but still recording ongoing (e.g. in the other tab..)
                    if (_bScreenLocked === true) {
                        sap.m.MessageToast.show("Please finalize the step in the Popup, before proceeding...");
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                    return;
                }

                _bActive = false;
                onClick(el);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            };

            sap.m.MessageToast.show("UI5-Testrecorder fully injected!");
        }

        function onClick(oDOMNode) {
            console.log('Clicked on: ', oDOMNode);
            var oControl = _getControlFromDom(oDOMNode);
            if (!oControl) {
                return;
            }
            //per default (on purpose) reset the clicked element to "root" - the user should activly (!!) set the lower aggregation as valid..
            var oOriginalDomNode = oDOMNode;
            oDOMNode = oControl.getDomRef();
            oDOMNode.classList.add('ElementReveal');

            //TODO: this._resetCache();


            //in case we are actually a "local-id", and we do NOT have "sParentAggregationName" set, and our parent is undefined
            //this means that we are actually a dumbshit (100% depending) child control - we will move up in that case..
            if (!oControl.getParent() && !oControl.sParentAggregationName && RegExp("([A-Z,a-z,0-9])-([A-Z,a-z,0-9])").test(oControl.getId()) === true) {
                var sItem = oControl.getId().substring(0, oControl.getId().lastIndexOf("-"));
                var oCtrlTest = sap.ui.getCore().byId(sItem);
                if (oCtrlTest) {
                    oControl = oCtrlTest;
                    oDOMNode = oControl.getDomRef();
                }
            }

            var oItem = this._setItem(oControl, oDOMNode, oOriginalDomNode);
            //remove the "non-serializable" data..
            //TODO: this.fireEventToContent("itemSelected", this._removeNonSerializable(oItem));
            //TODO: this.lockScreen();
        }

        /**
         * UI5-Testrecorder Page Inject functional coding - END
         */

        /**
         * UI5-Testrecorder Page Inject assist functions - START
         */

        function _getControlFromDom(oDOMNode) {
            debugger;
            var oControls = [];
            if (oDOMNode.id) {
                oControls = jQuery(document.getElementById(oDOMNode.id)).control();
            } else {
                oControls = jQuery(oDOMNode).control();
            }

            if (!oControls || !oControls.length) {
                return null;
            }
            return oControls[0];
        }

        /**
         * UI5-Testrecorder Page Inject assist functions - END
         */

        //Finished setting up the coding now check if UI5 is loaded on the page.
        console.log("- UI5-Testrecorder code appended");
        test();

    }, {}]
}, {}, [1]);