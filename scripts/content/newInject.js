/* eslint-disable no-console */
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
        (function () {
            debugger;
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

            console.log("- wait until UI5 is loaded ...");

            //callback for ui5 loaded
            function success(oResult) {
                console.log('Finished setup, inform extension about success!');
                port.postMessage({
                    type: "info",
                    data: {
                        text: "port connection works."
                    }
                });
            }

            //callback as error case
            function error(oError) {
                console.log("Something bad happend!")
                port.postMessage({
                    type: "error",
                    data: oError
                });
                port.disconnect();
            }

            const maxWaitTime = 3000;
            var waited = 0;
            var intvervalID = setInterval(function () {
                waited = waited + 100;
                if (document.readyState === "complete") {
                    clearInterval(intvervalID);
                    success(sap.ui);
                } else if (waited > maxWaitTime) {
                    clearInterval(intvervalID);
                    error({
                        message: "Waiting time for sap missed!"
                    });
                }
            }, 100);
        }());
    }, {}]
}, {}, [1]);