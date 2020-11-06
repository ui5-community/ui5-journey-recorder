sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "com/ui5/testing/model/code-generation/OPA5CodeStrategy",
    "com/ui5/testing/model/code-generation/NaturalCodeStrategy",
    "com/ui5/testing/model/code-generation/TestCafeCodeStrategy",
    "com/ui5/testing/model/code-generation/TestCafeBuilderCodeStrategy",
    "com/ui5/testing/model/code-generation/UIVeri5CodeStrategy"
], function (UI5Object,
    JSONModel,
    OPA5CodeStrategy,
    NaturalCodeStrategy,
    TestCafeCodeStrategy,
    TestCafeBuilderCodeStrategy,
    UIVeri5CodeStrategy) {
    "use strict";

    var CodeHelper = UI5Object.extend("com.ui5.testing.model.CodeHelper", {
        /**
         *  simple constructor
         */
        constructor: function () {
            this._oModel = new JSONModel({});
        }
    });

    CodeHelper.prototype.getFullCode = function (oCodeSettings, aElements) {
        this._oModel.setProperty("/codeSettings", oCodeSettings);
        switch (oCodeSettings.language) {
            case 'OPA':
                return new OPA5CodeStrategy().generate(oCodeSettings, aElements, this);
            case 'TCF_B':
                return new TestCafeBuilderCodeStrategy().generate(oCodeSettings, aElements, this);
            case 'TCF':
                return new TestCafeCodeStrategy().generate(oCodeSettings, aElements, this);
            case 'UI5':
                return new UIVeri5CodeStrategy().generate(oCodeSettings, aElements, this);
            case 'NAT':
                return new NaturalCodeStrategy().generate(oCodeSettings, aElements, this);
            default:
                return "";
        }
    };

    CodeHelper.prototype.getItemCode = function (oCodeSettings, oElement) {
        switch (oCodeSettings.language) {
            case 'OPA':
                return [new OPA5CodeStrategy().createTestStep(oCodeSettings, oElement)];
            case 'TCF_B':
                return new TestCafeBuilderCodeStrategy().createTestStep(oCodeSettings, oElement);
            case 'TCF':
                return new TestCafeCodeStrategy().createTestStep(oCodeSettings, oElement);
            case 'UI5':
                var oDef = new UIVeri5CodeStrategy().createTestStep(oCodeSettings, oElement);
                return oDef.definitons.concat(oDef.code);
            case 'NAT':
                return [new NaturalCodeStrategy().createTestStep(oCodeSettings, oElement)];
            default:
                return [];
        }
    };

    return new CodeHelper();
});
