/*!
* SAP
* (c) Copyright 2015 SAP SE or an SAP affiliate company.
* Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
(function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)s(r[o]); return s })({
    1: [function (require, module, exports) {
        (function () {
            'use strict';

            // Inject a script file in the current page
            var script = document.createElement('script');
            script.src = chrome.extension.getURL('/scripts/injected/ui5Testing.js');
            document.head.appendChild(script);

            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.id = "testing_ui5";
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = chrome.extension.getURL('/scripts/injected/style.css');
            link.media = 'all';
            head.appendChild(link);

            var oInitializedPromise = new Promise(function (resolve, reject) {
                document.addEventListener('do-ui5-ok', function (oXMLEvent) {
                    if (!oXMLEvent.detail.ok) {
                        reject();
                    }
                    resolve(oXMLEvent.detail);
                });
            });

            script.onload = function () {
                script.parentNode.removeChild(script);
                document.dispatchEvent(new CustomEvent('do-ui5-init'));
            };

            oInitializedPromise.then(function (oVers) {
                //(1) inform popup, that we are loaded.. yay..
                chrome.runtime.sendMessage({ type: "loaded", data: { ok: true, version: oVers.version } }, function (response) {
                });

                var oLastDom = null;
                document.addEventListener("mousedown", function (event) {
                    if (event.button == 2) {
                        oLastDom = event.target;
                    }
                }, true);

                var oLastAnswer = {};
                document.addEventListener('do-ui5-from-inject-to-extension', function (oXMLEvent) {
                    chrome.runtime.sendMessage(oXMLEvent.detail, function (response) {
                    });
                });
                document.addEventListener('do-ui5-from-inject-to-answer', function (oXMLEvent) {
                    oLastAnswer[oXMLEvent.detail.uuid].data = oXMLEvent.detail;
                });
                document.addEventListener('do-ui5-from-inject-to-async', function (oXMLEvent) {
                    oLastAnswer[oXMLEvent.detail.uuid].data = oXMLEvent.detail;

                    chrome.runtime.sendMessage({ type: "answer-async", data: oXMLEvent.detail }, function (response) {
                    });
                });

                //forewarding from extension to injection...
                chrome.runtime.onMessage.addListener(
                    function (request, sender, sendResponse) {
                        if (request.type && request.type === "ui5-check-if-injected") {
                            sendResponse({
                                injected: true
                            });
                        }
                        setTimeout(function () {
                            if (request.type) {
                                oLastAnswer[request.uuid] = { data: null, uuid: request.uuid, resolver: sendResponse };
                                var bSend = false;
                                if (request.type == "start" && request.data && request.data.startImmediate == true) {
                                    if (oLastDom) {
                                        request.data = {
                                            startImmediate: true,
                                            domId : oLastDom.id
                                        };
                                        document.dispatchEvent(new CustomEvent('do-ui5-from-extension-to-inject', { detail: request }));
                                        bSend = true;
                                    }
                                }

                                if (bSend == false) {
                                    document.dispatchEvent(new CustomEvent('do-ui5-from-extension-to-inject', { detail: request }));
                                }
                                sendResponse({
                                    data: {
                                        asyncAnswer: true
                                    }
                                });
                            }
                        }, 0);

                        return true; //allow async processing..
                    });
            }, function () {
                chrome.runtime.sendMessage({ type: "loaded", data: { ok: false } }, function (response) {
                });
            });
        }());

    }, {}]
}, {}, [1]);
