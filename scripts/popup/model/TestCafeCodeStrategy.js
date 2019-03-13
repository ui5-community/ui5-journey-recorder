sap.ui.define([
    "sap/ui/base/Object"
], function (UI5Object) {
    "use strict";
    var TestCafeCodeStrategy = UI5Object.extend("com.ui5.testing.model.TestCafeCodeStrategy", {});

    TestCafeCodeStrategy.prototype.generate = function (oCodeSettings, aElements, oCodeHelper) {
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
                aLines = this.createTestStep(aElements[i]);
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

    TestCafeCodeStrategy.prototype.createTestStep = function (oElement) {
        var sCode = "";
        var aCode = [];
        //get the actual element - this might seem a little bit superflicious,
        // but is very helpful for exporting/importing (where the references are gone)
        var oSelector = oElement.selector;
        var sType = oElement.property.type; // SEL | ACT | ASS
        var sActType = oElement.property.actKey; //PRS|TYP

        //(1) first: build up the actual selector
        var sSelector;
        var sSelectorAttributes;

        sSelector = oSelector.selector;
        sSelectorAttributes = oSelector.selectorAttributesStringified;
        var sSelectorFinal = sSelector + "(" + sSelectorAttributes + ")";

        var sAction = "";
        if (sType === "SEL") {
            sCode = "await " + sSelectorFinal + ";";
            aCode = [sCode];
        } else if (sType === 'ACT') {
            sCode = "await t.";
            switch (sActType) {
                case "PRS":
                    sAction = "click";
                    break;
                case "TYP":
                    sAction = "typeText";
                    break;
                default:
                    return "";
            }

            if (sActType === "TYP" && oElement.property.selectActInsert.length === 0) {
                //there is no native clearing.. :-) we have to select the next and press the delete key.. yeah
                //we do not have to check "replace text" - empty text means ALWAYS replace
                sCode = "await t.selectText(" + sSelectorFinal + ");";
                aCode = [sCode];
                sCode = "await t.pressKey('delete');";
                aCode.push(sCode);
            } else {
                sCode = sCode + sAction + "(" + sSelectorFinal;
                if (sActType === "TYP") {
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
                aCode = [sCode];
            }
        } else if (sType === 'ASS') {
            for (var i = 0; i < oElement.assertion.code.length; i++) {
                sCode = "await t." + "expect(" + sSelectorFinal + oElement.assertion.code[i] + ";";
                aCode.push(sCode);
            }
        }

        if (oElement.property.actionSettings.blur) {
            //this is just a dummy.. a utils method fireing a "blur" would be better..
            aCode.push('await t.click(Selector(".sapUiBody"));');
        }

        return aCode;
    };

    return TestCafeCodeStrategy;
});