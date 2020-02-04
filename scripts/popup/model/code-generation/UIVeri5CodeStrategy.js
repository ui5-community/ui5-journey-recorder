sap.ui.define([
    "sap/ui/base/Object",
    "com/ui5/testing/model/Utils"
], function (UI5Object, Utils) {
    "use strict";

    return UI5Object.extend("com.ui5.testing.model.code-generation.UIVeri5CodeStrategy", {
        /**
         *
         */
        constructor: function () {
            this._aNameStack = {};
        },

        /**
         *
         * @param {*} oCodeSettings
         * @param {*} aElements
         * @param {*} oCodeHelper
         */
        generate: function (oCodeSettings, aElements, oCodeHelper) {
            var aCodes = [];
            var bSupportAssistant = oCodeSettings.supportAssistant;

            //for testcafe we are returning: (1) installation instructions..
            var oCodeInstall = {
                codeName: "Installation (Non WebIDE)",
                type: "FTXT",
                order: 3,
                code: "<h3>Installation</h3>" +
                    "<p>Execute the following command-line paramters:</p>" +
                    "<code>npm install @ui5/uiveri5 -g</code>" +
                    "<p>Create a new folder \"test\\e2e\"within your webapp folder</p>" +
                    "<h3>Test-Configuration</h3>" +
                    "<p>Write a configuration file (conf.js), and copy over the code (if not existing already)</p>" +
                    "<h3>Create Test</h3>" +
                    "<p>Write a test.spec.js file, and copy over the code.</p>" +
                    "<h3>Running</h3>" +
                    "<p>Run via Command-Line via: <code>uiveri5" + (oCodeSettings.authentification === 'FIORI' ? " --params.user=_USER_ --params.pass=_PASS_" : "") + "</code><br/>" +
                    "For all details, please see the official github repository <a href=\"https://github.com/SAP/ui5-uiveri5\" style=\"color:green; font-weight:600;\">ui5-uiveri5</a></p>"
            };
            aCodes.push(oCodeInstall);

            //(2) configuration.js
            var oCodeTest = {
                codeName: "conf.js",
                type: "CODE",
                order: 2
            };

            var sCodeConf = "exports.config = {\n";
            sCodeConf += "  profile: 'integration',\n";
            sCodeConf += "  baseUrl: '" + oCodeSettings.testUrl + "'\n";
            if (oCodeSettings.authentification === "FIORI") {
                sCodeConf += ",\n";
                sCodeConf += "  auth: {\n";
                sCodeConf += "     'fiori-form': {\n";
                sCodeConf += "        user: '${params.user}',\n";
                sCodeConf += "        pass: '${params.pass}'\n";
                sCodeConf += "     }\n";
                sCodeConf += "  }\n";
            }
            sCodeConf += "};";
            oCodeTest.code = sCodeConf;
            aCodes.push(oCodeTest);


            //(3) execute script
            var oCodeSpec = {
                codeName: "test.spec.js",
                type: "CODE",
                order: 1
            };
            var sCode = "";
            var aCluster = this._groupCodeByCluster(aElements);

            sCode += "describe('test' , function () {\n";
            sCode += "\n";

            //make the rest of the OPA calls..
            for (var i = 0; i < aCluster.length; i++) {
                var aLinesDef = [];
                var aLinesCode = [];
                this._aNameStack = {};

                sCode += "    it('Test " + i + "', function () {\n";
                for (var j = 0; j < aCluster[i].length; j++) {
                    var oElement = aCluster[i][j];

                    if (oElement.property.type !== "SUP") {
                        var oRes = this.createTestStep(oCodeSettings, oElement);
                        if (oRes.definitons.length) {
                            aLinesDef.push(oRes.definitons);
                        }
                        aLinesCode = aLinesCode.concat(oRes.code);
                    }
                }
                var aLines = aLinesDef.concat(aLinesCode);
                for (var x = 0; x < aLines.length; x++) {
                    sCode += "        " + aLines[x] + "\n";
                }

                sCode += "    });\n";
            }

            sCode += "\n});";

            oCodeSpec.code = sCode;
            aCodes.push(oCodeSpec);
            return aCodes;
        },

        /**
         *
         * @param {*} oCodeSettings
         * @param {*} oElement
         */
        createTestStep: function (oCodeSettings, oElement) {
            var sCode = "";
            var aCode = [];

            //ui5-specific (1): for ui5, we must have a CONSISTENT parent handling (parentl4 is not possible without l3,l2 and l1) - we will simply add the controlType for those missing..
            var oSelector = oElement.selector;
            if (oSelector.selectorUI5.parentL4 && !oSelector.selectorUI5.parentL3) {
                oSelector.selectorUI5.parentL3 = {
                    controlType: oElement.item.parentL3.metadata.elementName
                };
            }
            if (oSelector.selectorUI5.parentL3 && !oSelector.selectorUI5.parentL2) {
                oSelector.selectorUI5.parentL2 = {
                    controlType: oElement.item.parentL2.metadata.elementName
                };
            }
            if (oSelector.selectorUI5.parentL2 && !oSelector.selectorUI5.parent) {
                oSelector.selectorUI5.parent = {
                    controlType: oElement.item.parent.metadata.elementName
                };
            }

            var sType = oElement.property.type; // SEL | ACT | ASS
            var sActType = oElement.property.actKey; //PRS|TYP
            var oUI5Selector = oSelector.selectorUI5;

            //(1) first: build up the actual selector
            var sSelectorAttributes = "";
            var sSelectorFinal = sSelectorAttributes;

            var sDomChildWith = "";
            if (oElement.property.domChildWith.startsWith("-")) {
                sDomChildWith = oElement.property.domChildWith.substr(1);
            } else {
                sDomChildWith = oElement.property.domChildWith;
            }

            var bAddSuffix = false;
            var oInteraction = null;
            if (sType === "ACT" && sDomChildWith.length > 0) {
                oUI5Selector.own = typeof oUI5Selector.own !== "undefined" ? oUI5Selector.own : {};
                oInteraction = {
                    interaction: {
                        idSuffix: sDomChildWith
                    }
                }
                oUI5Selector.own.interaction = oInteraction.interaction;
                bAddSuffix = true;
            } else {
                if (oElement.item.defaultInteraction) {
                    oUI5Selector.own.interaction = oElement.item.defaultInteraction;
                }
                if (oUI5Selector.parent && oElement.item.parent.defaultInteraction) {
                    oUI5Selector.parent.interaction = oElement.item.parent.defaultInteraction;
                }
                if (oUI5Selector.parentL2 && oElement.item.parentL2.defaultInteraction) {
                    oUI5Selector.parentL2.interaction = oElement.item.parentL2.defaultInteraction;
                }
                if (oUI5Selector.parentL3 && oElement.item.parentL3.defaultInteraction) {
                    oUI5Selector.parentL3.interaction = oElement.item.parentL3.defaultInteraction;
                }
                if (oUI5Selector.parentL4 && oElement.item.parentL4.defaultInteraction) {
                    oUI5Selector.parentL4.interaction = oElement.item.parentL4.defaultInteraction;
                }
            }

            var sElement = this._getUI5Element(oElement, oUI5Selector);
            var sElementAccess = sElement;
            var aDefinitions = [];

            if (oElement.property.useTechnicalName === true) {
                sElement = "var " + oElement.property.technicalName + " = " + sElement + ";";

                if (!this._aNameStack[oElement.item.identifier.ui5AbsoluteId]) {
                    this._aNameStack[oElement.item.identifier.ui5AbsoluteId] = oElement.property.technicalName;
                    aDefinitions.push(sElement);
                }
                sElementAccess = this._aNameStack[oElement.item.identifier.ui5AbsoluteId];
            }

            var sAction = "";
            var sText = "";
            if (sType === 'ACT') {
                sCode = sElement + ".";
                switch (sActType) {
                    case "PRS":
                        sAction = "click";
                        break;
                    case "TYP":
                        sAction = "sendKeys";
                        break;
                    default:
                        return "";
                }

                if (sActType === "TYP" && oElement.property.selectActInsert.length === 0) {
                    //there is no native clearing.. :-) we have to select the next and press the delete key.. yeah
                    //we do not have to check "replace text" - empty text means ALWAYS replace
                    sCode = sElementAccess + ".clear();";
                    aCode.push(sCode);
                } else {
                    sText = oElement.property.selectActInsert;
                    if (oElement.property.actionSettings.enter === true) {
                        sText += "\\uE007"; //ENTER key - see https://github.com/SeleniumHQ/selenium/blob/master/javascript/node/selenium-webdriver/lib/input.js#L52
                    }
                    if (sActType === "TYP" && oElement.property.actionSettings.replaceText === true) {
                        sCode = sElementAccess + ".clear();";
                        aCode.push(sCode);
                    }

                    sCode = sElementAccess + "." + sAction + "(";
                    if (sActType == "TYP") {
                        sCode = sCode + "'" + sText + "'";
                    }
                    sCode = sCode + ");";
                    aCode.push(sCode);
                }
            }

            if (sType === 'ASS') {
                if (oElement.assertion.assertType === "ATTR") {
                    for (var i = 0; i < oElement.assertion.assertCode.length; i++) {
                        //everything which is NOT a property, must be moved..
                        var oAss = oElement.assertion.assertCode[i];

                        if (oAss.assertField.type == "property") {
                            sCode = "expect(" + sElementAccess + ".asControl().getProperty(\"" + oAss.assertField.value + "\")).";

                            if (oAss.assertOperator == 'EQ') {
                                sCode += 'toBe('
                            } else if (oAss.assertOperator === 'NE') {
                                sCode += 'not.toBe('
                            } else if (oAss.assertOperator === 'CP') {
                                sCode += 'toContain('
                            } else if (oAss.assertOperator === 'NP') {
                                sCode += 'not.toContain('
                            }

                            if (typeof oAss.assertValue === "boolean") {
                                sCode += oAss.assertValue;
                            } else if (typeof oAss.assertValue === "number") {
                                sCode += oAss.assertValue;
                            } else {
                                sCode += '"' + oAss.assertValue + '"';
                            }
                            if (oElement.property.assertMessage) {
                                sCode += ",\"" + oElement.property.assertMessage + "\");";
                            } else {
                                sCode += ");";
                            }
                        } else {
                                //TODO:@ADRIAN -> hier noch richtige logik das table oder table0 verwendet bei definition davon.
                            //we are actually searching for "exists" now. we will hand over the attributes we are searching for into the searching handler..
                            var sElementTmp = this._getUI5Element(oElement, oUI5Selector, oAss);
                            if (oElement.property.useTechnicalName === true) {
                                var index = aDefinitions.indexOf("var " + oElement.property.technicalName + " = " + sElementTmp + ";");
                                if(index !== -1) {
                                        aDefinitions[index] = "var " + oElement.property.technicalName + i + " = " + sElementTmp + ";";
                                }
                            }

                            sCode = "expect(" + (this._aNameStack[oElement.item.identifier.ui5AbsoluteId] + i) + ".count()).toBeGreaterThan(0";

                            if (oElement.property.assertMessage) {
                                sCode += ",\"" + oElement.property.assertMessage + "\");";
                            } else {
                                sCode += ");";
                            }
                        }

                        aCode.push(sCode);
                    }
                } else if (oElement.assertion.assertType === "EXS") {
                    sCode = "expect(" + sElementAccess + ".count()).toBeGreaterThan(0";
                    if (oElement.property.assertMessage) {
                        sCode += ",\"" + oElement.property.assertMessage + "\");";
                    } else {
                        sCode += ");";
                    }
                    aCode = [sCode];
                } else if (oElement.assertion.assertType === "MTC") {
                    sCode = "expect(" + sElementAccess + ".count()).toBe(" + oElement.assertion.assertMatchingCount;
                    if (oElement.property.assertMessage) {
                        sCode += ",\"" + oElement.property.assertMessage + "\");";
                    } else {
                        sCode += ");";
                    }
                    aCode = [sCode];
                }
            }

            return {
                code: aCode,
                definitons: aDefinitions
            };
        },

        /**
         * Private methods
         */
        _groupCodeByCluster: function (aElements) {
            var aCluster = [
                []
            ];
            var bNextIsBreak = false;
            var aPages = {};
            for (var i = 0; i < aElements.length; i++) {
                if (bNextIsBreak === true) {
                    aCluster.push([]);
                    bNextIsBreak = false;
                }
                if (typeof aPages[aElements[i].item.viewProperty.localViewName] === "undefined") {
                    aPages[aElements[i].item.viewProperty.localViewName] = {
                        viewName: aElements[i].item.viewProperty.localViewName
                    };
                }
                if (i < aElements.length - 1 && aElements[i].property.type === "ASS" && aElements[i + 1].property.type === "ACT") {
                    bNextIsBreak = true;
                }
                aCluster[aCluster.length - 1].push(aElements[i]);
            }
            return aCluster;
        },

        /**
         *
         * @param {*} oElement
         * @param {*} oUI5Selector
         * @param {*} oAssert
         */
        _getUI5Element: function (oElement, oUI5Selector, oAssert) {
            var bMulti = false;
            //var sElementName = "";

            //name should be as unique as possible.. prio1, is localid - might be bullshit of course.. but ya..
            //sElementName = oElement.item.identifier.ui5LocalId;
            //sElementName = sElementName.replace(/^ ;-/i, '');
            var sElement = "element"; //make customizable, to get the name in it

            if (oElement.property.type === 'ASS' && (oElement.assertion.assertType === "MTC" || oElement.assertion.assertType === "EXS")) {
                bMulti = true;
            }

            if (oAssert) {
                oElement.property.selectItemBy = "ATTR"; //ids are already ok - no need to adjust..
                oUI5Selector.own = oUI5Selector.own ? oUI5Selector.own : {};
                oUI5Selector.own = $.extend({}, oUI5Selector.own, oAssert.assertUI5Spec);
            }

            if (oElement.property.selectItemBy === "DOM") {
                sElement += "(by.jq('" + oUI5Selector.id + "'))";
            } else if (oElement.property.selectItemBy === "UI5") {
                if (bMulti === true) {
                    sElement += ".all(by.";
                } else {
                    sElement += "(by.";
                }

                sElement += "control({ id: " + oUI5Selector.own.id;
                if (oUI5Selector.own.interaction) {
                    if (oUI5Selector.own.interaction.idSuffix) {
                        sElement += "," + "interaction: { idSuffix : \"" + oUI5Selector.own.interaction.idSuffix + "\" }";
                    } else {
                        sElement += "," + "interaction: \"" + oUI5Selector.own.interaction + "\"";
                    }
                }
                sElement += "}))";
            } else if (oElement.property.selectItemBy === "ATTR") {
                //go ahead by parentL4, L3, L2, L1 - for "cleaner" code, we will create seperate lines for every single one..
                var sParents = "";
                if (oUI5Selector.parentL4) {
                    sParents = sElement + "(by.control( " + Utils.getSelectorToJSONString(oUI5Selector.parentL4) + "))";
                }
                if (oUI5Selector.parentL3) {
                    sParents += (sParents.length > 0 ? "." : "") + sElement + "(by.control( " + Utils.getSelectorToJSONString(oUI5Selector.parentL3) + "))";
                }
                if (oUI5Selector.parentL2) {
                    sParents += (sParents.length > 0 ? "." : "") + sElement + "(by.control( " + Utils.getSelectorToJSONString(oUI5Selector.parentL2) + "))";
                }
                if (oUI5Selector.parent) {
                    sParents += (sParents.length > 0 ? "." : "") + sElement + "(by.control( " + Utils.getSelectorToJSONString(oUI5Selector.parent) + "))";
                }

                //syntax: element().element().element().all(target_element)
                var sOwnElement = "control( " + Utils.getSelectorToJSONString(oUI5Selector.own) + "))";
                if (sParents.length && bMulti === true) {
                    sElement = sParents + ".all(" + sOwnElement + ")";
                } else if (bMulti === true) {
                    sElement = sElement + ".all(by." + sOwnElement;
                } else if (sParents.length) {
                    sElement = sParents + ".element(by." + sOwnElement;
                } else {
                    sElement = sElement + "(by." + sOwnElement;
                }
            }

            return sElement;
        }
    });
});
