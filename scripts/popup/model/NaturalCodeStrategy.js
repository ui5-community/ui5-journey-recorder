sap.ui.define([
    "sap/ui/base/Object"
], function (UI5Object) {
    "use strict";

    var NaturalCodeStrategy = UI5Object.extend("com.ui5.testing.model.NaturalCodeStrategy", {
        constructor: function () {
            this._templates = {
                EN: {
                    onPage: function(pageName) {return `On page ${pageName}: `;},
                    enterText: function(actionText, controlID) {return `Enter ${actionText} at ${controlID}.`;},
                    clickButton: function(buttonName, additionalInfos) {return `Click element ${buttonName} ${additionalInfos}`;},
                    tableContainsNumElements: function(tableName, elemCount){return `The table ${tableName} should contain ${elemCount} elements.`;},
                    fromType: function(type) {return `of type ${type}`;}
                },
                DE: {
                    onPage: function(pageName) {return `Auf der Seite ${pageName}`;},
                    enterText: function(actionText, controlID) {return `${actionText} in ${controlID} eingeben`;},
                    clickButton: function(buttonName, additionalInfos) {return `Betätige Element ${buttonName} ${additionalInfos}`;},
                    tableContainsNumElements: function(tableName, elemCount){return `Die Tabelle ${tableName} sollte ${elemCount} Elemente enthalten.`;},
                    fromType: function(type) {return `vom Typ ${type}`;}
                }
            }
        }
    });

    NaturalCodeStrategy.prototype.generate = function (oCodeSettings, aElements, codeHelper) {
        var aCodes = [];

        aCodes.push({
            codeName: "Test description",
            type: "CTXT",
            order: 1,
            content: [],
            constants: []
        });

        aCodes[0]['code'] = this.__createTestSteps(oCodeSettings, aElements)
        return aCodes;
    };

    NaturalCodeStrategy.prototype.__createTestSteps = function (oCodeSettings, aElements) {
        var component = oCodeSettings.execComponent;
        var aParts = [];
        //from here starts the real testing
        for (var step in aElements) {
            var stepCode = this.createTestStep(aElements[step], component);
            if (stepCode) {
                aParts.push(stepCode);
            }
        }
        return aParts.reduce((a, b) => a + b, '');
    };

    NaturalCodeStrategy.prototype.createTestStep = function (oTestStep, oExecComponent) {
        var langCode = oExecComponent.getModel('settings').getProperty('/settings/defaultNatLanguage');

        switch (oTestStep.property.type) {
            case "ACT":
                return this.__createActionStep(oTestStep, this._templates[langCode]) + '\n';
            case "ASS":
                return this.__createExistStep(oTestStep, this._templates[langCode]) + '\n';
            default:
                return;
        }
    };

    NaturalCodeStrategy.prototype.__createActionStep = function (oStep, textToken) {
        var actionsType = oStep.property.actKey;
        switch (actionsType) {
            case 'TYP':
                return this.__createEnterTextAction(oStep, textToken);
            case 'PRS':
                return this.__createPressAction(oStep, textToken);
            default:
                console.log('Found a unknown action type: ' + actionsType);
                return "";
        }
    };

    NaturalCodeStrategy.prototype.__createExistStep = function (oStep, textToken) {
        if (oStep.assertFilter && oStep.assertFilter.some(a => a.criteriaType == 'AGG')) {
            return this.__createAggregationCheck(oStep, textToken);
        } else {
            var viewName = oStep.item.viewProperty.localViewName;
            var controlID = oStep.item.identifier.ui5LocalId;
            //this.__createObjectMatcherInfos(oStep, aParts);
            return 'There exists something\n';
        }
    };

    /*
    From here on concrete text generation
     */

    NaturalCodeStrategy.prototype.__createEnterTextAction = function (oStep, textToken) {
        var actionInsert = oStep.property.selectActInsert;
        var viewName = oStep.item.viewProperty.localViewName;
        var controlID = oStep.item.identifier.ui5LocalId;
        return textToken.onPage(viewName) + textToken.enterText(actionInsert, controlID) + '\n';
    };

    NaturalCodeStrategy.prototype.__createPressAction = function (oStep, textToken) {
        var controlClass = oStep.item.metadata.elementName;
        var viewName = oStep.item.viewProperty.localViewName;
        var controlID = oStep.item.identifier.ui5LocalId;
        return  textToken.onPage(viewName) + textToken.clickButton(controlID, textToken.fromType(controlClass) + '.') + '\n';

    };

    NaturalCodeStrategy.prototype.__createAggregationCheck = function (oStep, textToken) {
        var oAGGProp = oStep.assertFilter[0];

        if (oAGGProp.criteriaValue === 0) {
            if (oAGGProp.operatorType === 'EQ') {
                return 'Aggregation should be empty.\n';
            }

            if (oAGGProp.operatorType === 'GT') {
                return 'Aggregation should be filled.\n';
            } else {
                return "Something else Aggregation\n";
            }
        } else {
            return 'Aggregation should contain fixed numer of Elements.\n';
        }
    };

    return NaturalCodeStrategy;
});