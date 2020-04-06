sap.ui.define([
    "sap/ui/base/Object"
], function (UI5Object) {
    "use strict";

    var ItemBindingMatcherBuilder = UI5Object.extend("com.ui5.testing.model.code-generation.opa5.ItemBindingMatcherBuilder", {
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
            var sDefinition = '\
                sap.ui.define([ \n\
                    "sap/ui/test/matchers/Matcher" \n\
                ], function (Matcher) { \n\
                    "use strict"; \n\
                    \n\
                    return Matcher.extend("' + this.__namespace + '.<testPath>.customMatcher.ItemBindingMatcher", { \n\
                        metadata: { \n\
                            publicMethods: ["isMatching"], \n\
                            properties: { \n\
                                modelName: {type: "string"}, \n\
                                propertyName: {type: "string"}, \n\
                                propertyValue: {type: "string"} \n\
                            } \n\
                        }, \n\
                        \n\
                        isMatching: function (oControl) { \n\
                            if (!this.getPropertyName()) { \n\
                                this._oLogger.error("No propertyName given for control \'" + oControl + "\'"); \n\
                                return false; \n\
                            } \n\
                            \n\
                            var oBindingContext = oControl.getBindingContext(this.getModelName()); \n\
                            if (!oBindingContext) { \n\
                                this._oLogger.error("No bindingContext found for \'" + oControl + "\' and modelName " + this.getModelName()); \n\
                                return false; \n\
                            } \n\
                            \n\
                            var sPropertyValue = oBindingContext.getObject()[this.getPropertyName()]; \n\
                            if (!sPropertyValue) { \n\
                                this._oLogger.error("No value found for \'" + oControl + "\', modelName " + this.getModelName() + ", and property " + this.getPropertyName()); \n\
                                return false; \n\
                            } \n\
                            \n\
                            if (this.getPropertyValue()) { \n\
                                if (sPropertyValue === this.getPropertyValue()) { \n\
                                    return true; \n\
                                } else { \n\
                                    return false; \n\
                                } \n\
                            } else { \n\
                                return true; \n\
                            } \n\
                        } \n\
                    }); \n\
                });';

            // remove leading whitespace for code editor
            var iLengthWhitespace = sDefinition.match(/^([ \t]+)/g)[0].length;
            var oLeadingWhitespaceRegex = new RegExp("^[ \\t]{" + iLengthWhitespace + "}", "gm");
            sDefinition = sDefinition.replace(oLeadingWhitespaceRegex, "");

            // remove trailing whitespace for code editor
            sDefinition = sDefinition.replace(/([ ]+)$/gm, "");

            return sDefinition;
        }
    });

    return ItemBindingMatcherBuilder;
});
