/* eslint-disable require-jsdoc */
sap.ui.define([
], function(){
    "use strict";

    var _iUUIDSuffix = 0;

    var Utils = {
        statics: {
            stepTypes: [
                {key: "ACT", text: "Action"},
                {key: "ASS", text: "Assert"},
                {key: "SUP", text: "Support Assistant"}
            ],
            stepActions: [
                {key: "PRS", text: "Press"},
                {key: "TYP", text: "Type Text"}
            ],
            assertTypes: [
                {key: "ATTR", text: "Attributes"},
                {key: "EXS", text: "Exists"},
                {key: "MTC", text: "Matching Count"}
            ],
            selTypes: [
                {key: "UI5", text: "UI5-Identifier"},
                {key: "ATTR", text: "Combination of Attributes"},
                {key: 'DOM', text: "DOM-Identifiert"}
            ],
            attrType: [
                {key: "OWN", text: "Own Element"},
                {key: "VIW", text: "View"},
                {key: "PRT", text: "Parent-Element (L1)"},
                {key: "PRT2", text: "Parent-Element (L2)"},
                {key: "PRT3", text: "Parent-Element (L3)"},
                {key: "PRT4", text: "Parent-Element (L4)"},
                {key: "PLBL", text: "Label Element"},
                {key: "MCMB", text: "Item-Data"},
                {key: "AGR", text: "Aggregation"},
                {key: "PEL", text: "Previous Element"},
                {key: "NEL", text: "Next Element"}
            ],
            operator: [
                {key: "EQ", text: "Equal"},
                {key: "NE", text: "Not Equal"},
                {key: "CP", text: "Contains"},
                {key: "NP", text: "Not Contains"}
            ]
        },
        stringifyAttributes: function (script) {

            var sScript = JSON.stringify(script);
            const regex = /\"(\w+)(\s+)?\":/gm;
            let m;
            let hits = [];

            while ((m = regex.exec(sScript)) !== null) {
                hits.push({hit: m[0], match: m[1]});
            }

            hits.forEach(h => {
                sScript = sScript.replace(h.hit, ' ' + h.match + ': ');
            });

            return sScript;
        },
        replaceUnsupportedFileSigns: function(sString, sReplacement) {
            return sString.replace(/[\s\/\\\:\*\?\"\<\>\|\-]+/gm, sReplacement);
        },

        getUUIDv4: function () {
            var sStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }) + _iUUIDSuffix++;
            return sStr;
        },

        _getSelectorToJSONStringRec: function (oObject) {
            var sStringCurrent = "";
            var bFirst = true;
            var bIsRegex = false;
            for (var s in oObject) {
                var obj = oObject[s];
                if (!bFirst) {
                    sStringCurrent += ", ";
                }
                bIsRegex = false;
                bFirst = false;
                if (obj && obj.__isRegex && obj.__isRegex === true) {
                    obj = obj.id;
                    bIsRegex = true;
                }
                if (Array.isArray(obj)) {
                    sStringCurrent += s + ":" + "[";
                    for (var i = 0; i < obj.length; i++) {
                        if (i > 0) {
                            sStringCurrent += ",";
                        }
                        if (typeof obj[i] === "object") {
                            sStringCurrent += "{ ";
                            sStringCurrent += Utils._getSelectorToJSONStringRec(obj[i]);
                            sStringCurrent += " }";
                        } else {
                            sStringCurrent += Utils._getSelectorToJSONStringRec(obj[i]);
                        }
                    }
                    sStringCurrent += "]";
                } else if (typeof obj === "object") {
                    sStringCurrent += s + ": { ";
                    sStringCurrent += Utils._getSelectorToJSONStringRec(obj);
                    sStringCurrent += " }";
                } else {
                    if (this._oJSRegex.test(s) === false && bIsRegex === false) {
                        s = '"' + s + '"';
                    }
                    sStringCurrent += s;
                    sStringCurrent += " : ";
                    if (typeof obj === "boolean" || bIsRegex === true) {
                        sStringCurrent += obj;
                    } else if (typeof obj === "number") {
                        sStringCurrent += obj;
                    } else {
                        sStringCurrent += '\"' + obj + '"';
                    }
                }
            }
            return sStringCurrent;
        },

        getSelectorToJSONString: function (oObject) {
            this._oJSRegex = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/; //this is not perfect - we are working with predefined names, which are not getting "any" syntax though
            return "{ " + Utils._getSelectorToJSONStringRec(oObject) + " }";
        },

        /**
         * Request the browser permission 'tabs'.
         *
         * @returns {Promise} a promise whether the permission is granted (resolve) or not (reject)
         */
        requestTabsPermission: function () {

            var aPermissions = ["tabs"];
            var aOrigins = ["https://*/*", "http://*/*"];

            return new Promise(function (resolve, reject) {

                chrome.permissions.contains(
                    {
                        permissions: aPermissions,
                        origins: aOrigins
                    },
                    function (bGranted) {
                        if (bGranted) {
                            resolve();
                        } else {
                            // if the permission is not granted yet, request it!
                            chrome.permissions.request({
                                permissions: aPermissions,
                                origins: aOrigins
                            }, function (bGranted) {
                                if (bGranted) {
                                    resolve();
                                } else {
                                    reject();
                                }
                            });
                        }
                    }
                );
            });
        }

    };

    return Utils;
}, /* bExport */ true);
