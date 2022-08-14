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
            var sDefinition = '\
                sap.ui.define([ \n\
                    "sap/ui/test/matchers/Matcher", \n\
                    "sap/ui/test/matchers/PropertyStrictEquals" \n\
                ], function (Matcher, PropertyStrictEquals) { \n\
                    "use strict"; \n\
                    \n\
                    return Matcher.extend("' + this.__namespace + '.<testPath>.customMatcher.ParentMatcher", { \n\
                        metadata: { \n\
                            publicMethods: ["isMatching"], \n\
                            properties: { \n\
                                parentLevelAbove: {type: "int"}, \n\
                                parentId: {type: "object"}, \n\
                                parentClass: {type: "string"}, \n\
                                parentAttributes: {type: "array"} \n\
                            } \n\
                        }, \n\
                        \n\
                        isMatching: function (oControl) { \n\
                            var iLevelAbove = this.getParentLevelAbove(); \n\
                            if (!iLevelAbove) { \n\
                                this._oLogger.error("No parent level given for control \'" + oControl + "\'"); \n\
                                return false; \n\
                            } \n\
                            \n\
                            var oParent = oControl.getParent(); \n\
                            for (var i = 1; i < iLevelAbove && oParent; i++) { \n\
                                oParent = oParent.getParent(); \n\
                            } \n\
                            //check if parent exists \n\
                            if (!oParent) { \n\
                                return false; \n\
                            } \n\
                            if (this.getParentClass() && oParent.getMetadata().getName() !== this.getParentClass()) { \n\
                                return false; \n\
                            } \n\
                            if (this.getParentId() && !this.getParentId().test(oParent.getId())) { \n\
                                //oParent.getMetadata().getId() !== this.getParentId()) { \n\
                                return false; \n\
                            } \n\
                            \n\
                            var oParentAttributes = this.getParentAttributes(); \n\
                            for (var index in oParentAttributes) { \n\
                                var key = Object.keys(oParentAttributes[index])[0]; \n\
                                var value = oParentAttributes[index][key]; \n\
                                var oMatcher = new PropertyStrictEquals({name: key, value: value}); \n\
                                \n\
                                if (!oMatcher.isMatching(oParent)) { \n\
                                    return false; \n\
                                } \n\
                            } \n\
                            \n\
                            return true; \n\
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

    return ParentMatcherBuilder;
});
