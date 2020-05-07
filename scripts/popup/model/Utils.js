sap.ui.define([
    "sap/ui/base/Object"
], function (UI5Object) {
    "use strict";

    var _iUUIDSuffix = 0;

    var Utils = UI5Object.extend("com.ui5.testing.model.Utils", {

        _criteriaTypes: null,
        _attributeTypes: null,
        _oElementMix: null,

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
                {key: "UI5", text: "UI5 Identifier"},
                {key: "ATTR", text: "Combination of Attributes"},
                {key: 'DOM', text: "DOM Identifier"}
            ],
            attrType: [
                {key: "OWN", text: "Own Element"},
                {key: "VIW", text: "View"},
                {key: "PRT", text: "Parent Element (L1)"},
                {key: "PRT2", text: "Parent Element (L2)"},
                {key: "PRT3", text: "Parent Element (L3)"},
                {key: "PRT4", text: "Parent Element (L4)"},
                {key: "PLBL", text: "Label Element"},
                {key: "MCMB", text: "Item Data"},
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

        constructor: function() {
            this._criteriaTypes = {
                "ID": {
                    criteriaKey: "ID",
                    criteriaText: "Identifier",
                    criteriaSpec: function () {
                        return [{
                            subCriteriaType: "ID",
                            subCriteriaText: "Global ID",
                            value: function (oItem) {
                                return oItem.identifier.ui5Id;
                            },
                            code: function (sValue) {
                                return { identifier: { ui5Id: sValue } };
                            },
                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                iValue = typeof iValue === "undefined" ? this.value(oItem) : iValue;
                                oAdjust.id = {
                                    id: new RegExp(iValue + "$").toString(),
                                    __isRegex: true
                                };
                            },
                            assert: function (sValue) {
                                return "identifier.ui5Id";
                            }
                        }, {
                            subCriteriaType: "LID",
                            subCriteriaText: "Local ID",
                            value: function (oItem) {
                                return oItem.identifier.ui5LocalId;
                            },
                            code: function (sValue) {
                                return { identifier: { ui5LocalId: sValue } };
                            },
                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                iValue = typeof iValue === "undefined" ? this.value(oItem) : iValue;
                                oAdjust.id = {
                                    id: new RegExp(iValue + "$").toString(),
                                    __isRegex: true
                                };
                            },
                            assert: function (sValue) {
                                return "identifier.ui5LocalId";
                            },
                            assertField: function (sValue) {
                                return {
                                    type: "id"
                                };
                            }
                        }];
                    }
                },
                "MTA": {
                    criteriaKey: "MTA",
                    criteriaText: "Metadata",
                    criteriaSpec: function () {
                        return [{
                            subCriteriaType: "ELM",
                            subCriteriaText: "Control type",
                            value: function (oItem) {
                                return oItem.metadata.elementName;
                            },
                            code: function (sValue) {
                                return { metadata: { elementName: sValue } };
                            },

                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                iValue = typeof iValue === "undefined" ? this.value(oItem) : iValue;
                                oAdjust.controlType = iValue;
                            },
                            assert: function () {
                                return "metadata.elementName";
                            },
                            assertField: function (sValue) {
                                return {
                                    type: "elementName"
                                };
                            }
                        }, {
                            subCriteriaType: "CMP",
                            subCriteriaText: "Component name",
                            value: function (oItem) {
                                return oItem.metadata.componentName;
                            },
                            code: function (sValue) {
                                return { metadata: { componentName: sValue } };
                            },
                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                //not possible..
                            },
                            assert: function () {
                                return "metadata.componentName";
                            },
                            assertField: function (sValue) {
                                return {
                                    type: "componentName"
                                };
                            }
                        }];
                    }
                },
                "VIW": {
                    criteriaKey: "VIW",
                    criteriaText: "View Data",
                    criteriaSpec: function () {
                        return [{
                            subCriteriaType: "VIWNM",
                            subCriteriaText: "View name",
                            value: function (oItem) {
                                return oItem.viewProperty.viewName;
                            },
                            code: function (sValue) {
                                return { viewProperty: { viewName: sValue } };
                            },
                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                oAdjust.viewName = iValue;
                            },
                            assert: function () {
                                return "viewProperty.viewName";
                            },
                            assertField: function (sValue) {
                                return {
                                    type: "viewName"
                                };
                            }
                        }, {
                            subCriteriaType: "VIWLNM",
                            subCriteriaText: "Local view name",
                            value: function (oItem) {
                                return oItem.viewProperty.localViewName;
                            },
                            code: function (sValue) {
                                return { viewProperty: { localViewName: sValue } };
                            },
                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                iValue = typeof iValue === "undefined" ? this.value(oItem) : iValue;
                                oAdjust.viewName = new RegExp(iValue + "$").toString();
                            },
                            assert: function () {
                                return "viewProperty.localViewName";
                            },
                            assertField: function (sValue) {
                                return {
                                    type: "localViewName"
                                };
                            }
                        }];
                    }
                },
                "AGG": {
                    criteriaKey: "AGG",
                    criteriaText: "Aggregation",
                    criteriaSpec: function (oItem) {
                        var aReturn = [];
                        for (var sAggregationName in oItem.aggregation) {
                            var oAggregation = oItem.aggregation[sAggregationName];
                            aReturn.push({
                                subCriteriaType: oAggregation.name + "/" + "length",
                                subCriteriaText: oAggregation.name + "/" + "length",
                                aggregationName: oAggregation.name,
                                code: function (sAggregation, sValue) {
                                    var oReturn = { aggregation: {} };
                                    oReturn.aggregation[sAggregation] = { length: sValue };
                                    return oReturn;
                                }.bind(this, oAggregation.name),
                                value: function (sAggregation, oItem) {
                                    return oItem.aggregation[sAggregation].length;
                                }.bind(this, oAggregation.name),

                                getUi5Spec: function (oAdjust, oItem, iValue) {
                                    iValue = typeof iValue === "undefined" ? this.value(oItem) : iValue;
                                    if (iValue === 0) {
                                        oAdjust.aggregationEmpty = {
                                            name: this.aggregationName
                                        };
                                    } else {
                                        oAdjust.aggregationLengthEquals = {
                                            name: this.aggregationName,
                                            value: iValue
                                        };
                                    }
                                },
                                assert: function (sAggregation) {
                                    return "aggregation." + sAggregation + "." + "length";
                                }.bind(this, oAggregation.name),
                                assertField: function (sValue) {
                                    return {
                                        type: "aggregation"
                                    };
                                }
                            });
                        }
                        return aReturn;
                    }.bind(this)
                },
                /*@Adrian - Start
                "MODL": {
                    criteriaKey: "MODL",
                    criteriaText: "Model-Keys (Specific)",
                    criteriaSpec: function (oItem) {
                        var oMetadata = oItem.classArray;
                        var aReturn = [];
                        for (var i = 0; i < oMetadata.length; i++) {
                            var sElementName = oMetadata[i].elementName;
                            /*
                            var oType = _oElementModelValues[sElementName];

                            if (oType) {
                                for (var sModel in oType) {

                                    if (!oItem.model[sModel === "undefined" ? undefined : sModel]) {
                                        continue;
                                    }

                                    for (var sProperty in oType[sModel]) {
                                        var sPropertyValue = oItem.model[sModel === "undefined" ? undefined : sModel][sProperty];
                                        if (typeof sPropertyValue === "undefined") {
                                            continue;
                                        }

                                        aReturn.push({
                                            subCriteriaType: sModel + "/" + sProperty,
                                            subCriteriaText: oType[sModel][sProperty],
                                            code: function (sModel, sProperty, sValue) {
                                                var oReturn = { model: {} };
                                                oReturn.model[sModel] = {};
                                                oReturn.model[sModel][sProperty] = sValue;
                                                return oReturn;
                                            }.bind(this, sModel, sProperty),
                                            value: function (sModel, sProperty, oItem) {
                                                if (!oItem.model[sModel]) {
                                                    return "";
                                                }
                                                return oItem.model[sModel][sProperty];
                                            }.bind(this, sModel, sProperty),
                                            getUi5Spec: function (oAdjust, oItem, iValue) {
                                                return ""; //not really possible
                                            },
                                            assert: function (sModel, sProperty) {
                                                return "model." + sModel + "." + sProperty;
                                            }.bind(this, sModel, sProperty),
                                            assertField: function (sValue) {
                                                return {
                                                    type: "prop"
                                                }
                                            }
                                        });
                                    }
                                }
                            }//
                        }
                        return aReturn;
                    }
                },
                @Adrian - End*/
                "BNDG": {
                    criteriaKey: "BNDG",
                    criteriaText: "Binding path",
                    criteriaSpec: function (oItem) {
                        var aReturn = [];

                        for (var sAttr in oItem.binding) {
                            if (typeof oItem.binding[sAttr].path !== "object") {
                                var sModel = oItem.binding[sAttr].model;
                                var sModelStringified = sModel === "undefined" || sModel === undefined ? "" : sModel;
                                var sModelStringifiedPrefixed = (sModelStringified ? sModelStringified + ">" : "");

                                aReturn.push({
                                    subCriteriaType: sAttr,
                                    subCriteriaText: "Attribute '" + sAttr + "'",
                                    value: function (sModelPrefix, sAttribute, oItem) {
                                        return sModelPrefix + oItem.binding[sAttribute].path;
                                    }.bind(this, sModelStringifiedPrefixed, sAttr),
                                    code: function (sModel, sAttr, oItem, sValue) {
                                        var oReturn = { binding: {} };
                                        oReturn.binding[sAttr] = {
                                            prefixedFullPath: sValue,
                                            relativePath: oItem.binding[sAttr].relativePath,
                                            contextPath: oItem.binding[sAttr].contextPath,
                                            model: sModel
                                        };
                                        return oReturn;
                                    }.bind(this, sModelStringified, sAttr, oItem),
                                    getUi5Spec: function (oAdjust, oItem, iValue) {
                                        return ""; //not really possible right?
                                    },
                                    assert: function (sModel, sAttr) {
                                        return "context." + sModel + "." + sAttr;
                                    }.bind(this, sModel, sAttr),
                                    assertField: function (sValue) {
                                        return {
                                            type: "context"
                                        }
                                    }
                                });

                            }
                        }

                        return aReturn;
                    }.bind(this)
                },

                "ATTR": {
                    criteriaKey: "ATTR",
                    criteriaText: "Attributes",
                    criteriaSpec: function (oItem) {
                        var aReturn = [];
                        for (var sProperty in oItem.property) {
                            aReturn.push({
                                subCriteriaType: sProperty,
                                subCriteriaText: sProperty,
                                code: function (sProperty, sValue) {
                                    var oReturn = { property: {} };
                                    oReturn.property[sProperty] = sValue;
                                    return oReturn;
                                }.bind(this, sProperty),
                                value: function (subCriteriaType, oItem) {
                                    return oItem.property[subCriteriaType];
                                }.bind(this, sProperty),
                                getUi5Spec: function (oAdjust, oItem, iValue) {
                                    //restriction: maximum one binding path apperently?
                                    iValue = typeof iValue === "undefined" ? this.value(oItem, sProperty) : iValue;

                                    oAdjust.properties = typeof oAdjust.properties != "undefined" ? oAdjust.properties : [];
                                    var oProp = {};
                                    oProp[this.subCriteriaType] = iValue;
                                    oAdjust.properties.push(oProp);
                                },
                                assert: function (subCriteriaType) {
                                    return "property." + subCriteriaType;
                                }.bind(this, sProperty),
                                assertField: function (sValue) {
                                    return {
                                        type: "property",
                                        value: this.subCriteriaType
                                    };
                                }
                            });
                        }
                        return aReturn;
                    }
                }
            };

            this._attributeTypes = {
                "OWN": {
                    getItem: function (oItem) { return oItem; },
                    getScope: function (oScope) { return oScope; },
                    getAssertScope: function () { return ""; },
                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["MODL"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"], this._criteriaTypes["VIW"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["VIW"]]
                },
                "VIW": {
                    getItem: function (oItem) { return oItem.view; },
                    getScope: function (oScope) { oScope.view = oScope.view ? oScope.view : {}; return oScope.view; },
                    getAssertScope: function () { return "view."; },
                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                },
                "PRT": {
                    getItem: function (oItem) { return oItem.parent; },
                    getAssertScope: function () { return "parent."; },
                    getScope: function (oScope) { oScope.parent = oScope.parent ? oScope.parent : {}; return oScope.parent; },

                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                },
                "PRT2": {
                    getItem: function (oItem) { return oItem.parentL2; },
                    getAssertScope: function () { return "parentL2."; },
                    getScope: function (oScope) { oScope.parentL2 = oScope.parentL2 ? oScope.parentL2 : {}; return oScope.parentL2; },

                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                },
                "PRT3": {
                    getItem: function (oItem) { return oItem.parentL3; },
                    getAssertScope: function () { return "parentL3."; },
                    getScope: function (oScope) { oScope.parentL3 = oScope.parentL3 ? oScope.parentL3 : {}; return oScope.parentL3; },

                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                },
                "PRT4": {
                    getItem: function (oItem) { return oItem.parentL4; },
                    getAssertScope: function () { return "parentL4."; },
                    getScope: function (oScope) { oScope.parentL4 = oScope.parentL4 ? oScope.parentL4 : {}; return oScope.parentL4; },

                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                },
                "PLBL": {
                    getItem: function (oItem) { return oItem.label; },
                    getAssertScope: function () { return "label."; },
                    getScope: function (oScope) { oScope.label = oScope.label ? oScope.label : {}; return oScope.label; },

                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                },
                "MCMB": {
                    getItem: function (oItem) {
                        return oItem.itemdata;
                    },
                    getScope: function (oScope) { oScope.itemdata = oScope.itemdata ? oScope.itemdata : {}; return oScope.itemdata; },
                    getAssertScope: function () { return "itemdata."; },

                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    //criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"], this._criteriaTypes["BNDG"]]
                    criteriaTypes: [this._criteriaTypes["ID"], this._criteriaTypes["ATTR"], this._criteriaTypes["BNDG"], this._criteriaTypes["MTA"], this._criteriaTypes["AGG"]]
                }
            };

            this._oElementMix = {
                "sap.m.StandardListItem": {
                    defaultAttributes: function (oItem) {
                        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                        if (!oItem.itemdata || !oItem.itemdata.identifier || !oItem.itemdata.identifier.ui5Id) {
                            return [];
                        }
                        if (!oItem.itemdata.identifier.ui5Id.length) {
                            return [];
                        }
                        return [{ attributeType: "MCMB", criteriaType: "ATTR", subCriteriaType: "key" }];
                    }
                },
                "sap.ui.core.Element": {
                    defaultAction: "PRS",
                    actions: {
                        "PRS": [{ text: "Root", domChildWith: "", order: 99 }],
                        "TYP": [{ text: "Root", domChildWith: "", order: 99 }]
                    }
                },
                "sap.ui.core.Icon": {
                    preferredProperties: ["src"],
                    defaultAttributes: function (oItem) {
                        return [{ attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "src" }];
                    }
                },
                "sap.m.ObjectListItem": {
                    cloned: true,
                    preferredProperties: ["title"]
                },
                "sap.m.List": {
                    defaultInteraction: "root"
                },
                "sap.m.MultiInput": {
                    defaultInteraction: "root",
                    defaultEnter: true
                },
                "sap.m.Button": {
                    defaultAction: "PRS",
                    preferredProperties: ["text", "icon"],
                    defaultAttributes: function (oItem) {
                        var aReturn = [];
                        if (oItem.binding.text) {
                            aReturn.push({ attributeType: "OWN", criteriaType: "BNDG", subCriteriaType: "text" });
                        }
                        if (oItem.binding.icon) {
                            aReturn.push({ attributeType: "OWN", criteriaType: "BNDG", subCriteriaType: "icon" });
                        } else if (oItem.property.icon) {
                            aReturn.push({ attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "icon" });
                        }
                        if (oItem.binding.tooltip) {
                            aReturn.push({ attributeType: "OWN", criteriaType: "BNDG", subCriteriaType: "tooltip" });
                        }
                        return aReturn;
                    }
                },
                "sap.m.ListItemBase": {
                    cloned: true,
                    askForBindingContext: true
                },
                "sap.ui.core.Item": {
                    cloned: true,
                    defaultAttributes: function (oItem) {
                        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                        //return [{ attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "key" }];
                        //the KEY attribute is better in case the item is bound against a JSON list binding..
                        var bPropertyIsBetter = true;
                        if (oItem.binding.key) {
                            //for odata we will access the actual key...
                            if (oItem.binding.key.jsonBinding === false ) {
                                bPropertyIsBetter = false;
                            }
                        }
                        return [{ attributeType: "OWN", criteriaType: bPropertyIsBetter ? "ATTR" : "BNDG", subCriteriaType: "key" }];
                    }
                },
                "sap.m.Link": {
                    defaultAttributes: function (oItem) {
                        //if the text is static --> take the binding with priority..
                        if (oItem.binding && oItem.binding["text"] && oItem.binding["text"].static === true) {
                            return [{ attributeType: "OWN", criteriaType: "BNDG", subCriteriaType: "text" }];
                        } else if (oItem.property.text && oItem.property.text.length > 0) {
                            return [{ attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "text" }];
                        } else if (oItem.property.text && oItem.property.text.length > 0) {
                            return [{ attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "target" }];
                        } else if (oItem.property.text && oItem.property.text.length > 0) {
                            return [{ attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "href" }];
                        }
                    }
                },
                "sap.m.ComboBoxBase": {
                    defaultAction: "PRS",
                    actions: {
                        "PRS": [{ text: "Arrow (Open List)", domChildWith: "-arrow", preferred: true, order: 1 }]
                    }
                },
                "sap.m.GenericTile": {
                    defaultAction: "PRS",
                    defaultAttributes: [{ attributeType: "PRT2", criteriaType: "ATTR", subCriteriaType: "target" },
                        { attributeType: "PRT2", criteriaType: "MTA", subCriteriaType: "ELM" }]
                },
                "sap.m.MultiComboBox": {
                    defaultAction: "PRS",
                    actions: {
                        "PRS": [{ text: "Arrow (Open List)", domChildWith: "-arrow", preferred: true, order: 1 }]
                    }
                },
                "sap.m.Text": {
                    preferredProperties: ["text"],
                    preferredType: "ASS"
                },
                "sap.m.Select": {
                    defaultAction: "PRS",
                    actions: {
                        "PRS": [{ text: "Arrow (Open List)", domChildWith: "-arrow", preferred: true, order: 1 }]
                    }
                },
                "sap.m.InputBase": {
                    defaultAction: "TYP",
                    actions: {
                        "TYP": [{ text: "In Input-Field", domChildWith: "-inner", preferred: true, order: 1 }]
                    }
                },
                "sap.ui.table.Row": {
                    cloned: true,
                    defaultAction: "PRS",
                    actions: {
                        "PRS": [{ text: "On Selection-Area", domChildWith: "-col0", preferred: true, order: 1 }]
                    }
                },
                "sap.m.SearchField": {
                    defaultAction: [{ domChildWith: "-search", action: "PRS" },
                    { domChildWith: "-reset", action: "PRS" },
                    { domChildWith: "", action: "TYP" }]
                }
            };
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
                            sStringCurrent += this._getSelectorToJSONStringRec(obj[i]);
                            sStringCurrent += " }";
                        } else {
                            sStringCurrent += this._getSelectorToJSONStringRec(obj[i]);
                        }
                    }
                    sStringCurrent += "]";
                } else if (typeof obj === "object") {
                    sStringCurrent += s + ": { ";
                    sStringCurrent += this._getSelectorToJSONStringRec(obj);
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
            return "{ " + this._getSelectorToJSONStringRec(oObject) + " }";
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
        },

        getCriteriaTypes: function () {
            return this._criteriaTypes;
        },

        getAttributeTypes: function () {
            return this._attributeTypes;
        },

        getElementMix: function () {
            return this._oElementMix;
        },

        /**
         *
         * @param {*} oLine
         * @param {*} oItem
         */
        getValueSpec: function (oLine, oItem) {
            var aCriteriaSettings = this._criteriaTypes[oLine.criteriaType].criteriaSpec(oItem);
            for (var j = 0; j < aCriteriaSettings.length; j++) {
                if (aCriteriaSettings[j].subCriteriaType === oLine.subCriteriaType) {
                    return aCriteriaSettings[j];
                }
            }
            return null;
        },

        /**
         *
         * @param {*} oElement
         */
        getAssertDefinition: function (oElement) {
            var sBasisCode = "";
            var sCode = "";
            var aAsserts = oElement.assertFilter;
            var oAssertScope = {};
            var sAssertType = oElement.property.assKey;
            var sAssertMsg = oElement.property.assertMessage;
            var aCode = [];
            var sAssertCount = oElement.property.assKeyMatchingCount;
            var aReturnCodeSimple = [];

            if (sAssertType === 'ATTR') {
                sBasisCode += ".getUI5(" + "({ element }) => element.";
                for (var x = 0; x < aAsserts.length; x++) {
                    oAssertScope = {}; //reset per line..
                    var oAssert = aAsserts[x];

                    var oAssertLocalScope = this._attributeTypes[oAssert.attributeType].getAssertScope(oAssertScope);
                    oAssert.localScope = oAssertLocalScope;
                    var oAssertSpec = this.getValueSpec(oAssert, oElement.item);
                    oAssert.spec = oAssertSpec ? oAssertSpec.assert() : null;
                    if (oAssertSpec === null) {
                        continue;
                    }

                    var sAssertFunc = "";
                    if (oAssert.operatorType == 'EQ') {
                        sAssertFunc = 'eql';
                    } else if (oAssert.operatorType === 'NE') {
                        sAssertFunc = 'notEql';
                    } else if (oAssert.operatorType === 'CP') {
                        sAssertFunc = 'contains';
                    } else if (oAssert.operatorType === 'NP') {
                        sAssertFunc = 'notContains';
                    }


                    var sAddCode = sBasisCode;
                    var sAssertCode = oAssertSpec.assert();
                    sAddCode += sAssertCode;

                    var oUI5Spec = {};
                    oAssertSpec.getUi5Spec(oUI5Spec, oElement.item, oAssert.criteriaValue);

                    aReturnCodeSimple.push({
                        assertType: oAssert.operatorType,
                        assertLocation: sAssertCode,
                        assertOperator: oAssert.operatorType,
                        assertValue: oAssert.criteriaValue,
                        assertField: oAssertSpec.assertField(),
                        assertUI5Spec: oUI5Spec,
                        assertMsg: sAssertMsg
                    });

                    sAddCode += "))" + "." + sAssertFunc + "(" + "'" + oAssert.criteriaValue + "'";
                    if (sAssertMsg !== "") {
                        sAddCode += "," + '"' + sAssertMsg + '"';
                    }
                    sAddCode += ")";
                    aCode.push(sAddCode);
                }
            } else if (sAssertType === "EXS") {
                sCode = sBasisCode + ".exists).ok(";
                if (sAssertMsg !== "") {
                    sCode += '"' + sAssertMsg + '"';
                }
                sCode += ")";
                aCode.push(sCode);
            } else if (sAssertType === "MTC") {
                sCode = sBasisCode + ".count).eql(" + parseInt(sAssertCount, 10) + "";
                if (sAssertMsg !== "") {
                    sCode += "," + '"' + sAssertMsg + '"';
                }
                sCode += ")";
                aCode.push(sCode);
            }

            return {
                asserts: aAsserts,
                code: aCode,
                assertType: sAssertType,
                assertMsg: sAssertMsg,
                assertCode: aReturnCodeSimple,
                assertMatchingCount: sAssertCount,
                assertScope: oAssertLocalScope
            };
        },

    });

    return new Utils();
}, /* bExport */ true);
