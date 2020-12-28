sap.ui.define([
    "sap/ui/base/Object",
    "com/ui5/testing/model/Utils"
], function (UI5Object, Utils) {
    "use strict";
    var TestCafeBuilderCodeStrategy = UI5Object.extend("com.ui5.testing.model.TestCafeBuilderCodeStrategy", {});

    TestCafeBuilderCodeStrategy.prototype.generate = function (oCodeSettings, aElements, oCodeHelper) {
        var aCodes = [];
        var bSupportAssistant = oCodeSettings.supportAssistant;

        //for testcafe we are returning: (1) installation instructions..
        var oCodeInstall = {
            codeName: "Installation (Non WebIDE)",
            type: "FTXT",
            order: 2,
            code: "<h3>Installation</h3>" +
                "<p>Execute the following command-line paramters:</p>" +
                "<code>npm install testcafe testcafe-reporter-xunit ui5-testcafe-selector --save-dev</code>" +
                "<p>This will install all relevant packages for the test-automation runner.</p>" +
                "<h3>Test-Configuration</h3>" +
                "<p>Write a new testfile and copy/paste the code. The file can both be a typescript or a javascript file.</p>" +
                "<h3>Running</h3>" +
                "<p>Run via Command-Line via: <code>testcafe chrome your_test_file.js/ts</code><br/>" +
                "Run via Grunt using <a href=\"https://www.npmjs.com/package/grunt-testcafe\" style=\"color:green; font-weight:600;\">grunt-testcafe</a></p>"
        };
        aCodes.push(oCodeInstall);

        //(2) execute script
        var oCodeTest = {
            codeName: "Test",
            type: "CODE",
            order: 1
        };
        var sCode;
        var bSupportAssistantNeeded = bSupportAssistant;
        var bSelectorNeeded = false;
        for (var i = 0; i < aElements.length; i++) {
            if (aElements[i].property.type === "SUP") {
                bSupportAssistantNeeded = true;
            }
            if (aElements[i].property.actionSettings.blur === true) {
                bSelectorNeeded = true;
            }
        }

        sCode = 'import { UI5Selector ' + (bSupportAssistantNeeded || oCodeSettings.authentification !== 'NONE' ? ", utils " : "") + '} from "ui5-testcafe-selector";\n';
        if (bSelectorNeeded === true) {
            sCode += 'import { Selector } from "testcafe";\n';
        }
        sCode += "fixture('" + oCodeSettings.testCategory + "')\n";
        sCode += "  .page('" + oCodeSettings.testUrl + "');\n";
        sCode += "\n";
        sCode += "test('" + oCodeSettings.testName + "', async t => {\n";
        var sCurrentHash = null;
        var bVariableInitialized = false;
        var bHashChanged = true;

        if (oCodeSettings.authentification === 'FIORI') {
            sCode += "  await utils.launchpadLogin(t, '<USER>', '<PASSWORD>');\n";
        }
        for (var i = 0; i < aElements.length; i++) {
            var aLines = [];
            if (aElements[i].property.type !== "SUP") {
                aLines = this.createTestStep(oCodeSettings, aElements[i]);
            }

            if (sCurrentHash === null || sCurrentHash !== aElements[i].hash) {
                if (sCurrentHash !== null) {
                    sCode = sCode + "\n  //new route:" + aElements[i].hash + "\n";
                }
                sCurrentHash = aElements[i].hash;
                bHashChanged = true;
            }

            if ((bHashChanged === true && bSupportAssistant) || aElements[i].property.type === "SUP") {
                sCode += "  " + (bVariableInitialized === false ? "var " : "") + "oSupportAssistantResult = await utils.supportAssistant(t, '" + aElements[i].item.metadata.componentName + "' );\n";
                sCode += "  " + "await t.expect(oSupportAssistantResult.High.length).eql(0);\n";
                bVariableInitialized = true;
            }

            for (var j = 0; j < aLines.length; j++) {
                sCode += "  " + aLines[j] + "\n";
            }
        }
        sCode += "});";
        oCodeTest.code = sCode;
        aCodes.push(oCodeTest);
        return aCodes;
    };

    TestCafeBuilderCodeStrategy.prototype.getUI5Selector = function (oElement) {
        var oSelAttr = oElement.selector.selectorAttributes;

        var sStr = "ui5()";
        if (oSelAttr.metadata) {
            if (oSelAttr.metadata.elementName) {
                switch (oSelAttr.metadata.elementName) {
                    case 'sap.m.Button':
                        sStr += ".button()";
                        break;
                    case 'sap.m.Link':
                        sStr += ".link()";
                        break;
                    case 'sap.m.Text':
                        sStr += ".text()";
                        break;
                    case 'sap.m.MultiInput':
                        sStr += ".multiInput()";
                        break;
                    case 'sap.m.GenericTile':
                        sStr += ".genericTile()";
                        break;
                    case 'sap.ui.core.Item':
                        sStr += ".coreItem()";
                        break;
                    case 'sap.m.ObjectAttribute':
                        sStr += ".objectAttribute()";
                        break;
                    case 'sap.ui.core.Item':
                        sStr += ".coreItem()";
                        break;
                    case 'sap.m.ComboBox':
                    case 'sap.m.Select':
                        sStr += ".comboBox()";
                        break;
                    case 'sap.m.List':
                        sStr += ".list()";
                        break;
                    case 'sap.ui.table.Row':
                        sStr += ".tableRow()";
                        break;
                    default:
                        sStr += ".element('" + oSelAttr.metadata.elementName + "')";
                        break;
                }
            }
        }

        if (typeof oSelAttr === "string") {
            //pay a little attention - in a few edge cases we actually want to avoid to go into the complete id based access..
            if ((oElement.item.metadata.elementName === "sap.m.ComboBox" || oElement.item.metadata.elementName === "sap.m.Select") &&
                (oElement.property.domChildWith === '-arrow')) {
                sStr += ".id('" + oElement.item.identifier.ui5Id + "').comboBox().arrow()";
            }
            else {
                //we have to split dom child with and id in all cases..
                if (oElement.property.domChildWith !== '') {
                    sStr += ".id('" + oElement.item.identifier.ui5Id + "').domChildWith('" + oElement.property.domChildWith + "')";
                } else {
                    sStr += ".id('" + oSelAttr + "')";
                }
            }
        }

        if (oSelAttr.identifier) {
            sStr += ".id('" + (oSelAttr.identifier.ui5LocalId || oSelAttr.identifier.ui5Id || oSelAttr.identifier.ui5AbsoluteId) + "')";
        }

        if (oSelAttr.bindingContext) {
            for (var sAttr in oSelAttr.bindingContext) {
                sStr += ".bindingContextPath('" + sAttr + "', '" + oSelAttr.bindingContext[sAttr] + "')";
            }
        }

        if (oSelAttr.property) {
            for (var sAttr in oSelAttr.property) {
                sStr += ".property('" + sAttr + "', '" + oSelAttr.property[sAttr] + "')";
            }
        }

        if (oSelAttr.itemdata) {
            for (var sAttr in oSelAttr.itemdata.property) {
                sStr += ".itemdata('" + sAttr + "', '" + oSelAttr.itemdata.property[sAttr] + "')";
            }
        }

        if (oSelAttr.context) {
            for (var sAttr in oSelAttr.context) {
                sStr += ".context('" + sAttr + "', '" + oSelAttr.context[sAttr] + "')";
            }
        }

        if (oSelAttr.binding) {
            for (var sAttr in oSelAttr.binding) {
                for (var sPart in oSelAttr.binding[sAttr]) {
                    var oBdng = oSelAttr.binding[sAttr][sPart];
                    sStr += ".bindingPath('" + sAttr + "', '" + oBdng.prefixedFullPath + "')";
                    break;
                }
            }
        }

        if (oSelAttr.relativeBinding) {
            for (var sAttr in oSelAttr.relativeBinding) {
                for (var sPart in oSelAttr.relativeBinding[sAttr]) {
                    var oBdng = oSelAttr.relativeBinding[sAttr][sPart];
                    sStr += ".bindingPath('" + sAttr + "', '" + oSelAttr.relativeBinding[sAttr][sPart] + "')";
                }
            }
        }

        if (oSelAttr.tableInfo) {
            if (oSelAttr.tableInfo.tableRow) {
                sStr += ".row(" + oSelAttr.tableInfo.tableRow + ")";
            }
            if (oSelAttr.tableInfo.tableCol) {
                sStr += ".column(" + oSelAttr.tableInfo.tableCol + ")";
            }
            if (oSelAttr.tableInfo.tableColDescr) {
                sStr += ".columnDescr('" + oSelAttr.tableInfo.tableColDescr + "')";
            }
            if (oSelAttr.tableInfo.tableColId) {
                sStr += ".columnId('" + oSelAttr.tableInfo.tableColId + "')";
            }
            if (oSelAttr.tableInfo.insideATable) {
                sStr += ".insideATable(true)";
            }
        }

        if (oSelAttr.domChildWith) {
            sAttr += ".domChildWith('" + oSelAttr.domChildWith + "')";
        }

        //check any parents..
        var aParents = ["parent", "parentL2", "parentL3", "parentL4"];
        for (var i = 0; i < aParents.length; i++) {
            var oPar = oSelAttr[aParents[i]];
            if (!oPar) {
                continue;
            }
            if (oPar.metadata && oPar.metadata.elementName) {
                sStr += ".parentElementName('" + (oPar.metadata.elementName) + "')";

            }
            if (oPar.identifier) {
                sStr += ".parentId('" + (oPar.identifier.ui5Id || oPar.identifier.ui5LocalId || oPar.identifier.ui5AbsoluteId) + "')";
            }
            if (oPar.property) {
                for (var sProp in oPar.property) {
                    sStr += ".parentProperty('" + sProp + "', '" + oPar.property[sProp] + "')";
                }
            }
        }
        return sStr;
    };

    TestCafeBuilderCodeStrategy.prototype.createTestStep = function (oCodeSettings, oElement) {
        var sCode = "";
        var aCode = [];
        //get the actual element - this might seem a little bit superflicious,
        // but is very helpful for exporting/importing (where the references are gone)
        var sType = oElement.property.type; // SEL | ACT | ASS
        var sActType = oElement.property.actKey; //PRS|TYP

        //generate selector..
        var sUI5Selector = this.getUI5Selector(oElement);
        var aAttributeTypes = Utils.getAttributeTypes();

        var sAction = "";
        //in the builder variant we will always split the definition of our element and the actual action done on it..
        sCode = "const " + oElement.property.technicalName + " = " + sUI5Selector + ";";
        aCode = [sCode];

        if (sType === "SEL") {
            sCode = "const data = await " + oElement.property.technicalName + ".getUI5(); ";
            aCode.push(sCode);
        } else if (sType === 'ACT') {
            sCode = "await ";
            switch (sActType) {
                case "PRS":
                    sAction = "click";
                    break;
                case "TYP":
                    sAction = oElement.property.selectActInsert.length === 0 ? "clearText" : "typeText";
                    break;
                default:
                    return "";
            }

            sCode = "await u." + sAction + "(" + oElement.property.technicalName;

            if (sAction === 'typeText') {
                sCode = sCode + ',"' + oElement.property.selectActInsert + '"';
                if (oElement.property.actionSettings.pasteText === true ||
                    oElement.property.actionSettings.testSpeed !== 1 ||
                    oElement.property.actionSettings.replaceText === true) {
                    sCode += ", { paste: " + oElement.property.actionSettings.pasteText
                        + ", speed: " + oElement.property.actionSettings.testSpeed
                        + ", replace: " + oElement.property.actionSettings.replaceText
                        + " }"
                }
            }
            sCode = sCode + ");";
            aCode.push(sCode);
        } else if (sAction === 'clearText') {
            sCode = sCode + ");";
            aCode.push(sCode);
        } else if (sType === 'ASS') {
            debugger;

            var aAsserts = oElement.assertFilter;
            var sAssertType = oElement.property.assKey;
            var sAssertMsg = oElement.property.assertMessage ? "'" + oElement.property.assertMessage + "'" : "";
            var sAssertCount = oElement.property.assKeyMatchingCount;

            if (sAssertType === "EXS") {
                sCode = "await u.expect(" + sUI5Selector + ").exists().ok(" + sAssertMsg + ");";
                aCode.push(sCode);
            } else if (sAssertType === "MTC") {
                sCode = "await u.expect(" + sUI5Selector + ").count().equal( " + sAssertCount + (sAssertMsg.length ? "," : "") + sAssertMsg + " ); ";
                aCode.push(sCode);
            } else if (sAssertType === "VIS") {
                sCode = "await u.expect(" + sUI5Selector + ").visible().ok(" + sAssertMsg + ");";
                aCode.push(sCode);
            } else if (sAssertType === "ATTR") {
                for (var x = 0; x < aAsserts.length; x++) {
                    var oAssertScope = {}; //reset per line..
                    var oAssert = aAsserts[x];

                    var oAssertLocalScope = aAttributeTypes[oAssert.attributeType].getAssertScope(oAssertScope);
                    oAssert.localScope = oAssertLocalScope;
                    var oAssertSpec = Utils.getValueSpec(oAssert, oElement.item);
                    if (oAssertSpec === null) {
                        continue;
                    }

                    var sAssertFunc = "";
                    if (oAssert.operatorType == 'EQ') {
                        sAssertFunc = 'equal';
                    } else if (oAssert.operatorType === 'NE') {
                        sAssertFunc = 'notEqual';
                    } else if (oAssert.operatorType === 'CP') {
                        sAssertFunc = 'contains';
                    } else if (oAssert.operatorType === 'NP') {
                        sAssertFunc = 'notContains';
                    }

                    var sAssertCode = oAssertSpec.assert();
                    var oUI5Spec = {};
                    oAssertSpec.getUi5Spec(oUI5Spec, oElement.item, oAssert.criteriaValue);

                    var sCriteriaValueFormatted = oAssert.criteriaValue;
                    if (typeof oAssert.criteriaValue === "string") {
                        sCriteriaValueFormatted = "'" + sCriteriaValueFormatted + "'";
                    }

                    if (oAssert.criteriaType === "ATTR") {
                        sCode = "await u.expect(" + sUI5Selector + ").property('" + oAssert.subCriteriaType + "')." + sAssertFunc + "(" + sCriteriaValueFormatted + "" + (sAssertMsg.length ? "," : "") + sAssertMsg + ");";
                    } else {
                        sCode = "await u.expect(" + sUI5Selector + ").dynamic(e => " + "e." + sAssertCode + ")." + sAssertFunc + "(" + sCriteriaValueFormatted + "" + (sAssertMsg.length ? "," : "") + sAssertMsg + ");";
                    }
                    aCode.push(sCode);
                }
            }
        }

        if (oElement.property.actionSettings.blur) {
            aCode.push('await u.blur();');
        }

        return aCode;
    };

    return TestCafeBuilderCodeStrategy;
});