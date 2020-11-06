sap.ui.define([
    "sap/ui/base/Object",
    "com/ui5/testing/util/StringBuilder"
], function (UI5Object, StringBuilder) {
    "use strict";

    return UI5Object.extend("com.ui5.testing.model.code-generation.opa5.PageBuilder", {
        /**
         *
         */
        constructor: function (namespace, viewName, baseClass) {
            this.__namespace = namespace ? namespace : "template";
            this.__viewName = viewName ? viewName : "view1";
            this.__baseClass = baseClass ? baseClass : "Common";
            this.__dependencies = [{
                asyncDep: 'sap/ui/test/Opa5',
                paraDep: 'Opa5'
            }];

            this._actions = {
                press: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                },
                enterText: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                }
                // additional feature later on could be Drag&Drop
            };
            this._assertions = {
                exists: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                },
                attributes: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                },
                aggregationEmpty: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                },
                aggregationFilled: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                },
                aggregationCount: {
                    render: false,
                    addBindingMatcher: false,
                    addI18NMatcher: false,
                    addAttributeMatcher: false,
                    addParentMatcher: false
                }
            };
            this._customMatchers = {
                parent: false
            };
        },

        //#region getter
        /**
         *
         */
        getNamespace: function () {
            return this.__namespace;
        },
        //#endregion

        /**
         *  Generic settings method for the adder
         * 
         * @param {string} sType determination between action or assertion
         * @param {map} [oOptions] additional informations for the press action
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        _adder: function (sType, oOptions) {
            if (Object.keys(this._actions).includes(sType)) {
                this._actions[sType].render = true;
                this._actions[sType].addBindingMatcher = oOptions && oOptions.binding ? true : this._actions[sType].addBindingMatcher;
                this._actions[sType].addI18NMatcher = oOptions && oOptions.i18n ? true : this._actions[sType].addI18NMatcher;
                this._actions[sType].addAttributeMatcher = oOptions && oOptions.attribute ? true : this._actions[sType].addAttributeMatcher;
                this._actions[sType].addParentMatcher = oOptions && oOptions.parent ? true : this._actions[sType].addParentMatcher;

            }
            if (Object.keys(this._assertions).includes(sType)) {
                this._assertions[sType].render = true;
                this._assertions[sType].addBindingMatcher = oOptions && oOptions.binding ? true : this._assertions[sType].addBindingMatcher;
                this._assertions[sType].addI18NMatcher = oOptions && oOptions.i18n ? true : this._assertions[sType].addI18NMatcher;
                this._assertions[sType].addAttributeMatcher = oOptions && oOptions.attribute ? true : this._assertions[sType].addAttributeMatcher;
                this._assertions[sType].addParentMatcher = oOptions && oOptions.parent ? true : this._assertions[sType].addParentMatcher;
            }
            return this;
        },

        /**
         * Add a press action to the page
         *
         * @param {map} [oOptions] additional informations for the press action
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addPressAction: function (oOptions) {
            return this._adder("press", oOptions);
        },

        /**
         *
         *
         * @param {map} [oOptions] additional informations for the enter text action
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addEnterTextAction: function (oOptions) {
            return this._adder("enterText", oOptions);
        },

        /**
         *
         *
         * @param {map} [oOptions] additional informations
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addExistsCheck: function (oOptions) {
            return this._adder("exists", oOptions);
        },

        /**
         *
         *
         * @param {map} [oOptions] additional informations
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addAttributesCheck: function (oOptions) {
            return this._adder("attributes", oOptions);
        },

        /**
         *
         *
         * @param {map} [oOptions] additional informations
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addAggregationEmptyCheck: function (oOptions) {
            return this._adder("aggregationEmpty", oOptions);
        },

        /**
         *
         *
         * @param {map} [oOptions] additional informations
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addAggregationFilledCheck: function (oOptions) {
            return this._adder("aggregationFilled", oOptions);
        },

        /**
         *
         *
         * @param {map} [oOptions] additional informations
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
         */
        addAggregationCountCheck: function (oOptions) {
            return this._adder("aggregationCount", oOptions);
        },

        /**
         *
         */
        generate: function () {}
    });
});