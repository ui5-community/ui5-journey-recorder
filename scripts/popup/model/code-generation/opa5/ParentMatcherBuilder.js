sap.ui.define([
    "sap/ui/base/Object"
], function(UI5Object) {
    "use strict";

    var ParentMatcherBuilder = UI5Object.extend("com.ui5.testing.model.code-generation.opa5.ParentMatcherBuilder", {
        /**
         * Simple constructor instantiating all the member variables
         *
         * @param {string} namespace for the tested application
         */
        constructor: function(namespace) {
            this.__namespace = namespace ? namespace: "template";
        },

        /**
         * Generator function for the ParentMatcherBuilder
         *
         * @returns {string}
         */
        generate: function() {
            var aLines = [];
            aLines.push('sap.ui.define([\n');
            aLines.push(Array(2).join('\t') + '"sap/ui/test/matchers/Matcher",\n');
            aLines.push(Array(2).join('\t') + '"sap/ui/test/matchers/PropertyStrictEquals"\n');
            aLines.push('], function (Matcher, PropertyStrictEquals) {\n');
            aLines.push(Array(2).join('\t') + '"use strict";\n\n');
            aLines.push(Array(2).join('\t') + 'return Matcher.extend("' + this.__namespace + '\.<testPath>\.' + 'customMatcher.ParentMatcher", {\n');
            aLines.push(Array(3).join('\t') + 'metadata: {\n');
            aLines.push(Array(4).join('\t') + 'publicMethods: ["isMatching"],\n');
            aLines.push(Array(4).join('\t') + 'properties: {\n');
            aLines.push(Array(5).join('\t') + 'parentLevelAbove: {type: "int"},\n');
            aLines.push(Array(5).join('\t') + 'parentId: {type: "object"},\n');
            aLines.push(Array(5).join('\t') + 'parentClass: {type: "string"},\n');
            aLines.push(Array(5).join('\t') + 'parentAttributes: {type: "array"}\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(3).join('\t') + '},\n\n');
            aLines.push(Array(3).join('\t') + 'isMatching: function (oControl) {\n');
            aLines.push(Array(4).join('\t') + 'var iLevelAbove = this.getParentLevelAbove();\n');
            aLines.push(Array(4).join('\t') + 'if (!iLevelAbove) {\n');
            aLines.push(Array(5).join('\t') + 'this._oLogger.error("No parent level given for Control \'" + oControl + "\'");\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + 'var oParent = oControl.getParent();\n');
            aLines.push(Array(4).join('\t') + 'for (var i = 1; i < iLevelAbove && oParent; i++) {\n');
            aLines.push(Array(5).join('\t') + 'oParent = oParent.getParent();\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + '//check if parent exists\n');
            aLines.push(Array(4).join('\t') + 'if (!oParent) {\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + 'if (this.getParentClass() && oParent.getMetadata().getName() !== this.getParentClass()) {\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + 'if (this.getParentId() && !this.getParentId().test(oParent.getId())) {\n');
            aLines.push(Array(5).join('\t') + '//oParent.getMetadata().getId() !== this.getParentId()) {\n');
            aLines.push(Array(5).join('\t') + 'return false;\n');
            aLines.push(Array(4).join('\t') + '}\n\n');
            aLines.push(Array(4).join('\t') + 'var oParentAttributes = this.getParentAttributes();\n');
            aLines.push(Array(4).join('\t') + 'for (var index in oParentAttributes) {\n');
            aLines.push(Array(5).join('\t') + 'var key = Object.keys(oParentAttributes[index])[0];\n');
            aLines.push(Array(5).join('\t') + 'var value = oParentAttributes[index][key];\n');
            aLines.push(Array(5).join('\t') + 'var oMatcher = new PropertyStrictEquals({name: key, value: value});\n');
            aLines.push(Array(5).join('\t') + 'if (!oMatcher.isMatching(oParent)) {\n');
            aLines.push(Array(6).join('\t') + 'return false;\n');
            aLines.push(Array(5).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + '}\n');
            aLines.push(Array(4).join('\t') + 'return true;\n');
            aLines.push(Array(3).join('\t') + '}\n');
            aLines.push(Array(2).join('\t') + '});\n');
            aLines.push('});');
            return aLines.reduce((a,b) => a + b, '');
        }
    });

    return ParentMatcherBuilder;
});
