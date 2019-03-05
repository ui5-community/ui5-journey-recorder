sap.ui.define([
], function(){
    return {
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
                {key: "MTC", text: "Matching Count"},
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
            'use strict';
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
        getUUIDv4: function (oCaller) {
            var vGlobal = oCaller.getModel('settings').getProperty('/globalInt');
            var sStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }) + vGlobal;
            oCaller.getModel('settings').setProperty('/globalInt', vGlobal + 1);
            return sStr;
        }
    };
});