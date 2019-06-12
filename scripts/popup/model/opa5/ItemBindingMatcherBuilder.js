sap.ui.define([
    "sap/ui/base/Object"
], function (UI5Object) {
    "use strict";

    var ItemBindingMatcherBuilder = UI5Object.extend("com.ui5.testing.model.opa5.ItemBindingMatcherBuilder", {
        /**
         * Simple constructor instantiating all the member variables
         *
         * @param {string} namespace for the tested application
         */
        constructor: function (namespace) {
            this.__namespace = namespace ? namespace : "template";
        },

        /**
         * Generator function for the ItemBindingMatcherBuilder
         *
         * @returns {string}
         */
        generate: function () {
            var aLines = [];
            aLines.push('sap.ui.define([\n');
            aLines.push(Array(2).join('\t') + '"sap/ui/test/matchers/Matcher"\n');
            aLines.push('], function (Matcher) {\n');
            aLines.push(Array(2).join('\t') + '"use strict";\n\n');
            aLines.push(Array(2).join('\t') + 'return Matcher.extend("' + this.__namespace + '\.<testPath>\.' + 'customMatcher.ItemBindingMatcher", {\n');
            aLines.push(Array(3).join('\t') + 'metadata: {\n');
            aLines.push(Array(4).join('\t') + 'publicMethods: ["isMatching"],\n');
            aLines.push(Array(4).join('\t') + 'properties: {\n');
            aLines.push(Array(5).join('\t') + 'modelName: {type: "string"},\n');
            aLines.push(Array(5).join('\t') + 'propertyName: {type: "string"},\n');
            aLines.push(Array(5).join('\t') + 'propertyValue: {type: "string"}\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(3).join('\t') + '},\n\n');
            aLines.push(Array(3).join('\t') + 'isMatching: function (oControl) {\n');
            aLines.push(Array(4).join('\t') + 'if (!this.getPropertyName()) {\n');
            aLines.push(Array(5).join('\t') + 'this._oLogger.error("No propertyName given for Control \'" + oControl + "\'");\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + 'var oBindingContext = oControl.getBindingContext(this.getModelName());\n');
            aLines.push(Array(4).join('\t') + 'if (!oBindingContext) {\n');
            aLines.push(Array(5).join('\t') + 'this._oLogger.error("No bindingContext found for \'" + oControl + "\' and modelName " + this.getModelName());\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + 'var sPropertyValue = oBindingContext.getObject()[this.getPropertyName()];\n');
            aLines.push(Array(4).join('\t') + 'if (!sPropertyValue) {\n');
            aLines.push(Array(5).join('\t') + 'this._oLogger.error("No value found for \'" + oControl + "\',modelName " + this.getModelName() + " and property " + this.getPropertyName());\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n');

            aLines.push(Array(4).join('\t') + 'if (this.getPropertyValue()) {\n');
            aLines.push(Array(5).join('\t') + 'if (sPropertyValue === this.getPropertyValue()) {\n');
            aLines.push(Array(6).join('\t') + 'return true;\n');
            aLines.push(Array(5).join('\t') + '} else {\n');
            aLines.push(Array(6).join('\t') + 'return false;\n');
            aLines.push(Array(5).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + '} else {\n');

            aLines.push(Array(5).join('\t') + 'return true;\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(3).join('\t') + '}\n');
            aLines.push(Array(2).join('\t') + '});\n');
            aLines.push('});');
            return aLines.reduce((a, b) => a + b, '');
        }
    });

    return ItemBindingMatcherBuilder;
});