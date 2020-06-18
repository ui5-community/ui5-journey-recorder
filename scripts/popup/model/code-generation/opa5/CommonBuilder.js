sap.ui.define([
    "com/ui5/testing/model/code-generation/opa5/PageBuilder",
    "com/ui5/testing/util/StringBuilder"
], function (PageBuilder, StringBuilder) {
    "use strict";

    return PageBuilder.extend("com.ui5.testing.model.code-generation.opa5.CommonBuilder", {
        /**
         *
         */
        constructor: function (namespace, viewName, baseClass) {
            PageBuilder.prototype.constructor.call(this, namespace, viewName, baseClass);
            this._bindMatcher = false;
            this._i18nMatcher = false;
            this._attMatcher = false;
        },

        /**
         *  Generic settings method for the adder
         *
         * @param {string} sType determination between action or assertion
         * @param {map} [oOptions] additional informations for the press action
         * @param {boolean} [oOptions.binding] add a binding matcher for selection
         * @param {boolean} [oOptions.i18n] add an i18n matcher for selection
         * @param {boolean} [oOptions.attribute] add an attribute matcher for selection
         *
         * @override com.ui5.testing.model.code-generation.opa5.PageBuilder._adder
         *
         * @returns {com.ui5.testing.model.code-generation.opa5.CommonBuilder} self reference for chaining
         */
        _adder: function (sType, oOptions) {
            this._bindMatcher = oOptions && oOptions.binding ? true : this._bindMatcher;
            this._i18nMatcher = oOptions && oOptions.i18n ? true : this._i18nMatcher;
            this._attMatcher = oOptions && oOptions.attribute ? true : this._attMatcher;
            this._aggEmptyMatcher = oOptions && oOptions.aggEmpty ? true : this._aggEmptyMatcher;
            this._aggFilledMatcher = oOptions && oOptions.aggFilled ? true : this._aggFilledMatcher;
            this._aggCountMatcher = oOptions && oOptions.aggCount ? true : this._aggCountMatcher;
            this._pressAction = oOptions && oOptions.press ? true : this._pressAction;
            this._enterTextAction = oOptions && oOptions.enterText ? true : this._enterTextAction;

            PageBuilder.prototype._adder.call(this, sType, oOptions);

            return this;
        },

        /**
         *
         */
        generate: function () {
            var oCode = new StringBuilder('sap.ui.define([').addNewLine();
            oCode.add(this.__generateDependencies());
            /*  */
            oCode.addTab().add('"use strict";').addNewLine(2);
            oCode.add(this._addWrapParametersFunction());

            oCode.addTab().add('return Opa5.extend("' + this.__namespace + '.<testPath>.Common", {').addNewLine();
            oCode.addTab(2).add('iStartTheAppByHash: function(oParameters) {').addNewLine();
            oCode.addTab(3).add('MockServer.init(_wrapParameters(oParameters || {}));').addNewLine();
            oCode.addTab(3).add('this.iStartMyUIComponent({').addNewLine();
            oCode.addTab(4).add('componentConfig: {').addNewLine();
            oCode.addTab(5).add('name: "' + this.__namespace + '",').addNewLine();
            oCode.addTab(5).add('async: true').addNewLine();
            oCode.addTab(4).add('},').addNewLine();
            oCode.addTab(4).add('hash: oParameters.hash').addNewLine();
            oCode.addTab(3).add('});').addNewLine();
            oCode.addTab(2).add('},').addNewLine();
            oCode.addTab(2).add('iTeardownTheApp: function() {').addNewLine();
            oCode.addTab(3).add('this.iTeardownMyUIComponent();').addNewLine();
            oCode.addTab(2).add('}');

            oCode.add(this._generateActionFunctions());
            oCode.add(this._generateAssertionFunctions());

            if (this._bindMatcher) {
                oCode.add(',').addNewLine();
                oCode.add(this._addBindingMatcherFunction());
            }

            if (this._i18nMatcher) {
                oCode.add(',').addNewLine();
                oCode.add(this._addI18NMatcherFunction());
            }

            if (this._attMatcher) {
                oCode.add(',').addNewLine();
                oCode.add(this._addAttributeMatcherFunction());
            }

            oCode.addNewLine();
            oCode.addTab().add('});').addNewLine();
            oCode.add('});');
            return oCode.toString();
        },

        //#region actions
        /**
         * 
         */
        _generateActionFunctions: function () {
            var oActions = new StringBuilder();
            if (this._actions.press.render) {
                oActions.add(',').addNewLine();
                oActions.add(this.__generatePressFunction());
            }

            if (this._actions.enterText.render) {
                oActions.add(',').addNewLine();
                oActions.add(this.__generateEnterTextFunction());
            }
            return oActions.toString();
        },

        /**
         * 
         */
        __generateEnterTextFunction: function () {
            var oEnterText = new StringBuilder();
            oEnterText.addTab(2).add('enterText: function(oActionProperties, oOptions) {').addNewLine();
            oEnterText.addTab(3).add('var actionObject = {};').addNewLine();
            oEnterText.addTab(3).add('if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}').addNewLine();
            oEnterText.addTab(3).add('if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}').addNewLine();
            oEnterText.addTab(3).add('actionObject.visible = true;').addNewLine();
            oEnterText.addTab(3).add('actionObject.actions = [new EnterText({text: oActionProperties.actionText})];').addNewLine();
            oEnterText.addTab(3).add('if (oOptions.success) {').addNewLine();
            oEnterText.addTab(4).add('actionObject.success = oOptions.success;').addNewLine();
            oEnterText.addTab(3).add('}').addNewLine();
            oEnterText.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oEnterText.addTab(4).add('actionObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oEnterText.addTab(3).add('}').addNewLine(2);
            oEnterText.addTab(3).add('actionObject.matchers = [];').addNewLine(2);
            if (this._actions.enterText.addAttributeMatcher) {
                oEnterText.addTab(3).add('if(oActionProperties.attributes && oActionProperties.attributes.length > 0) {').addNewLine();
                oEnterText.addTab(4).add('this._addAttributeMatcher(actionObject.matchers, oActionProperties.attributes);').addNewLine();
                oEnterText.addTab(3).add('}').addNewLine();
            }
            if (this._actions.enterText.addBindingMatcher) {
                oEnterText.addTab(3).add('if (oActionProperties.binding && oActionProperties.binding.length > 0) {').addNewLine();
                oEnterText.addTab(4).add('this._addBindingMatcher(actionObject.matchers, oActionProperties.binding);').addNewLine();
                oEnterText.addTab(3).add('}').addNewLine();
            }
            if (this._actions.enterText.addI18NMatcher) {
                oEnterText.addTab(3).add('if (oActionProperties.i18n && oActionProperties.i18n.length > 0) {').addNewLine();
                oEnterText.addTab(4).add('this._addI18NMatcher(actionObject.matchers, oActionProperties.i18n);').addNewLine();
                oEnterText.addTab(3).add('}').addNewLine(2);
            }
            oEnterText.addTab(3).add('return this.waitFor(actionObject);').addNewLine();
            oEnterText.addTab(2).add('}');
            return oEnterText.toString();
        },

        /**
         * 
         */
        __generatePressFunction: function () {
            var oPress = new StringBuilder();
            oPress.addTab(2).add('press: function(oActionProperties, oOptions) {').addNewLine();
            oPress.addTab(3).add('var actionObject = {};').addNewLine();
            oPress.addTab(3).add('if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}').addNewLine();
            oPress.addTab(3).add('if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}').addNewLine();
            oPress.addTab(3).add('actionObject.visible = true;').addNewLine();
            oPress.addTab(3).add('actionObject.actions = [new Press()];').addNewLine();
            oPress.addTab(3).add('if (oOptions.success) {').addNewLine();
            oPress.addTab(4).add('actionObject.success = oOptions.success;').addNewLine();
            oPress.addTab(3).add('}').addNewLine();
            oPress.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oPress.addTab(4).add('actionObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oPress.addTab(3).add('}').addNewLine(2);
            oPress.addTab(3).add('actionObject.matchers = [];').addNewLine(2);
            if (this._actions.press.addAttributeMatcher) {
                oPress.addTab(3).add('if(oActionProperties.attributes && oActionProperties.attributes.length > 0) {').addNewLine();
                oPress.addTab(4).add('this._addAttributeMatcher(actionObject.matchers, oActionProperties.attributes);').addNewLine();
                oPress.addTab(3).add('}').addNewLine();
            }
            if (this._actions.press.addBindingMatcher) {
                oPress.addTab(3).add('if (oActionProperties.binding && oActionProperties.binding.length > 0) {').addNewLine();
                oPress.addTab(4).add('this._addBindingMatcher(actionObject.matchers, oActionProperties.binding);').addNewLine();
                oPress.addTab(3).add('}').addNewLine();
            }
            if (this._actions.press.addI18NMatcher) {
                oPress.addTab(3).add('if (oActionProperties.i18n && oActionProperties.i18n.length > 0) {').addNewLine();
                oPress.addTab(4).add('this._addI18NMatcher(actionObject.matchers, oActionProperties.i18n);').addNewLine();
                oPress.addTab(3).add('}').addNewLine(2);
            }
            oPress.addTab(3).add('return this.waitFor(actionObject);').addNewLine();
            oPress.addTab(2).add('}');
            return oPress.toString();
        },
        //#endregion

        //#region assertions
        /**
         *
         */
        _generateAssertionFunctions: function () {
            var oAssertFunctions = new StringBuilder();
            if (this._assertions.exists.render) {
                oAssertFunctions.add(',').addNewLine();
                oAssertFunctions.add(this._renderExistsFunction());
            }
            if (this._assertions.attributes.render) {
                oAssertFunctions.add(',').addNewLine();
                oAssertFunctions.add(this._renderAttributesFunction());
            }
            if (this._assertions.aggregationEmpty.render) {
                oAssertFunctions.add(',').addNewLine();
                oAssertFunctions.add(this._renderEmptyAggFunction());
            }
            if (this._assertions.aggregationFilled.render) {
                oAssertFunctions.add(',').addNewLine();
                oAssertFunctions.add(this._renderFilledAggFunction());
            }
            if (this._assertions.aggregationCount.render) {
                oAssertFunctions.add(',').addNewLine();
                oAssertFunctions.add(this._renderCountAggFunction());
            }
            return oAssertFunctions.toString();
        },

        /**
         *
         */
        _renderExistsFunction: function () {
            var oExists = new StringBuilder();
            oExists.addTab(2).add('exists: function(oMatchProperties, oOptions) {').addNewLine();
            oExists.addTab(3).add('var checkObject = {};').addNewLine();
            oExists.addTab(3).add('if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}').addNewLine();
            oExists.addTab(3).add('if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}').addNewLine(2);
            oExists.addTab(3).add('checkObject.visible = true;').addNewLine();
            oExists.addTab(3).add('if (oOptions.success) {').addNewLine();
            oExists.addTab(4).add('checkObject.success = oOptions.success;').addNewLine();
            oExists.addTab(3).add('}').addNewLine();
            oExists.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oExists.addTab(4).add('checkObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oExists.addTab(3).add('}').addNewLine(2);
            oExists.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
            if (this._assertions.exists.addAttributeMatcher) {
                oExists.addTab(3).add('if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {').addNewLine();
                oExists.addTab(4).add('this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);').addNewLine();
                oExists.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addBindingMatcher) {
                oExists.addTab(3).add('if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {').addNewLine();
                oExists.addTab(4).add('this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);').addNewLine();
                oExists.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addI18NMatcher) {
                oExists.addTab(3).add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {').addNewLine();
                oExists.addTab(4).add('this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);').addNewLine();
                oExists.addTab(3).add('}').addNewLine(2);
            }
            oExists.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
            oExists.addTab(2).add('}');

            return oExists.toString();
        },

        /**
         *
         */
        _renderAttributesFunction: function () {
            var oAttributes = new StringBuilder();
            oAttributes.addTab(2).add('hasAttributes: function(oMatchProperties, oOptions) {').addNewLine();
            oAttributes.addTab(3).add('var checkObject = {};').addNewLine();
            oAttributes.addTab(3).add('if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}').addNewLine();
            oAttributes.addTab(3).add('if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}').addNewLine(2);
            oAttributes.addTab(3).add('checkObject.visible = true;').addNewLine();
            oAttributes.addTab(3).add('if (oOptions.success) {').addNewLine();
            oAttributes.addTab(4).add('checkObject.success = oOptions.success;').addNewLine();
            oAttributes.addTab(3).add('}').addNewLine();
            oAttributes.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oAttributes.addTab(4).add('checkObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oAttributes.addTab(3).add('}').addNewLine(2);
            oAttributes.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
            if (this._assertions.exists.addAttributeMatcher) {
                oAttributes.addTab(3).add('if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {').addNewLine();
                oAttributes.addTab(4).add('this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);').addNewLine();
                oAttributes.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addBindingMatcher) {
                oAttributes.addTab(3).add('if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {').addNewLine();
                oAttributes.addTab(4).add('this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);').addNewLine();
                oAttributes.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addI18NMatcher) {
                oAttributes.addTab(3).add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {').addNewLine();
                oAttributes.addTab(4).add('this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);').addNewLine();
                oAttributes.addTab(3).add('}').addNewLine(2);
            }
            oAttributes.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
            oAttributes.addTab(2).add('}');

            return oAttributes.toString();
        },

        /**
         *
         */
        _renderEmptyAggFunction: function () {
            var oAggEmpty = new StringBuilder();
            oAggEmpty.addTab(2).add('aggregationEmpty: function(oMatchProperties, oOptions) {').addNewLine();
            oAggEmpty.addTab(3).add('var checkObject = {};').addNewLine();
            oAggEmpty.addTab(3).add('if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}').addNewLine();
            oAggEmpty.addTab(3).add('if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}').addNewLine(2);
            oAggEmpty.addTab(3).add('checkObject.visible = true;').addNewLine();
            oAggEmpty.addTab(3).add('if (oOptions.success) {').addNewLine();
            oAggEmpty.addTab(4).add('checkObject.success = oOptions.success;').addNewLine();
            oAggEmpty.addTab(3).add('}').addNewLine();
            oAggEmpty.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oAggEmpty.addTab(4).add('checkObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oAggEmpty.addTab(3).add('}').addNewLine(2);
            oAggEmpty.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
            if (this._assertions.exists.addAttributeMatcher) {
                oAggEmpty.addTab(3).add('if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {').addNewLine();
                oAggEmpty.addTab(4).add('this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);').addNewLine();
                oAggEmpty.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addBindingMatcher) {
                oAggEmpty.addTab(3).add('if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {').addNewLine();
                oAggEmpty.addTab(4).add('this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);').addNewLine();
                oAggEmpty.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addI18NMatcher) {
                oAggEmpty.addTab(3).add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {').addNewLine();
                oAggEmpty.addTab(4).add('this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);').addNewLine();
                oAggEmpty.addTab(3).add('}').addNewLine(2);
            }
            oAggEmpty.addTab(3).add('checkObject.matchers.push(').addNewLine();
            oAggEmpty.addTab(4).add('new AggregationEmpty({').addNewLine();
            oAggEmpty.addTab(5).add('name: oMatchProperties.aggName').addNewLine();
            oAggEmpty.addTab(4).add('}));').addNewLine();
            oAggEmpty.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
            oAggEmpty.addTab(2).add('}');

            return oAggEmpty.toString();
        },

        /**
         *
         */
        _renderFilledAggFunction: function () {
            var oAggFilled = new StringBuilder();
            oAggFilled.addTab(2).add('aggregationFilled: function(oMatchProperties, oOptions) {').addNewLine();
            oAggFilled.addTab(3).add('var checkObject = {};').addNewLine();
            oAggFilled.addTab(3).add('if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}').addNewLine();
            oAggFilled.addTab(3).add('if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}').addNewLine(2);
            oAggFilled.addTab(3).add('checkObject.visible = true;').addNewLine();
            oAggFilled.addTab(3).add('if (oOptions.success) {').addNewLine();
            oAggFilled.addTab(4).add('checkObject.success = oOptions.success;').addNewLine();
            oAggFilled.addTab(3).add('}').addNewLine();
            oAggFilled.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oAggFilled.addTab(4).add('checkObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oAggFilled.addTab(3).add('}').addNewLine(2);
            oAggFilled.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
            if (this._assertions.exists.addAttributeMatcher) {
                oAggFilled.addTab(3).add('if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {').addNewLine();
                oAggFilled.addTab(4).add('this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);').addNewLine();
                oAggFilled.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addBindingMatcher) {
                oAggFilled.addTab(3).add('if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {').addNewLine();
                oAggFilled.addTab(4).add('this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);').addNewLine();
                oAggFilled.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addI18NMatcher) {
                oAggFilled.addTab(3).add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {').addNewLine();
                oAggFilled.addTab(4).add('this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);').addNewLine();
                oAggFilled.addTab(3).add('}').addNewLine(2);
            }
            oAggFilled.addTab(3).add('checkObject.matchers.push(').addNewLine();
            oAggFilled.addTab(4).add('new AggregationFilled({').addNewLine();
            oAggFilled.addTab(5).add('name: oMatchProperties.aggName').addNewLine();
            oAggFilled.addTab(4).add('}));').addNewLine();
            oAggFilled.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
            oAggFilled.addTab(2).add('}');

            return oAggFilled.toString();
        },

        /**
         *
         */
        _renderCountAggFunction: function () {
            var oAggCount = new StringBuilder();
            oAggCount.addTab(2).add('aggregationCount: function(oMatchProperties, oOptions) {').addNewLine();
            oAggCount.addTab(3).add('var checkObject = {};').addNewLine();
            oAggCount.addTab(3).add('if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}').addNewLine();
            oAggCount.addTab(3).add('if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}').addNewLine(2);
            oAggCount.addTab(3).add('checkObject.visible = true;').addNewLine();
            oAggCount.addTab(3).add('if (oOptions.success) {').addNewLine();
            oAggCount.addTab(4).add('checkObject.success = oOptions.success;').addNewLine();
            oAggCount.addTab(3).add('}').addNewLine();
            oAggCount.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
            oAggCount.addTab(4).add('checkObject.errorMessage = oOptions.errorMessage;').addNewLine();
            oAggCount.addTab(3).add('}').addNewLine(2);
            oAggCount.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
            if (this._assertions.exists.addAttributeMatcher) {
                oAggCount.addTab(3).add('if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {').addNewLine();
                oAggCount.addTab(4).add('this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);').addNewLine();
                oAggCount.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addBindingMatcher) {
                oAggCount.addTab(3).add('if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {').addNewLine();
                oAggCount.addTab(4).add('this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);').addNewLine();
                oAggCount.addTab(3).add('}').addNewLine();
            }
            if (this._assertions.exists.addI18NMatcher) {
                oAggCount.addTab(3).add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {').addNewLine();
                oAggCount.addTab(4).add('this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);').addNewLine();
                oAggCount.addTab(3).add('}').addNewLine(2);
            }
            oAggCount.addTab(3).add('checkObject.matchers.push(').addNewLine();
            oAggCount.addTab(4).add('new AggregationLengthEquals({').addNewLine();
            oAggCount.addTab(5).add('name: oMatchProperties.aggName,').addNewLine();
            oAggCount.addTab(5).add('length: oMatchProperties.count').addNewLine();
            oAggCount.addTab(4).add('}));').addNewLine();
            oAggCount.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
            oAggCount.addTab(2).add('}');

            return oAggCount.toString();
        },
        //#endregion

        /**
         *
         */
        _addWrapParametersFunction: function () {
            var oFunctCode = new StringBuilder();
            oFunctCode.addTab().add('function _wrapParameters(oParameters) {').addNewLine();
            oFunctCode.addTab(2).add('return {').addNewLine();
            oFunctCode.addTab(3).add('get: function(name) {').addNewLine();
            oFunctCode.addTab(4).add('return (oParameters[name] || "").toString();').addNewLine();
            oFunctCode.addTab(3).add('}').addNewLine();
            oFunctCode.addTab(2).add('};').addNewLine();
            oFunctCode.addTab().add('}').addNewLine(2);
            return oFunctCode.toString();
        },

        //#region matcherAdding
        /**
         *
         */
        _addBindingMatcherFunction: function () {
            var oFunctCode = new StringBuilder();
            oFunctCode.addTab(2).add('_addBindingMatcher: function (aMatchers, aBindingInformations) {').addNewLine();
            oFunctCode.addTab(3).add('aBindingInformations.forEach(function (oBinding) {').addNewLine();
            oFunctCode.addTab(4).add('var oBindObject = {};').addNewLine();
            oFunctCode.addTab(4).add('if (oBinding.model) {').addNewLine();
            oFunctCode.addTab(5).add('oBindObject.modelName = oBinding.model;').addNewLine();
            oFunctCode.addTab(4).add('}').addNewLine();
            oFunctCode.addTab(4).add('if (oBinding.path) {').addNewLine();
            oFunctCode.addTab(5).add('oBindObject.path = oBinding.path;').addNewLine();
            oFunctCode.addTab(4).add('}').addNewLine();
            oFunctCode.addTab(4).add('if (oBinding.propertyPath) {').addNewLine();
            oFunctCode.addTab(5).add('oBindObject.propertyPath = oBinding.propertyPath;').addNewLine();
            oFunctCode.addTab(4).add('}').addNewLine();
            oFunctCode.addTab(4).add('aMatchers.push(new BindingPath(oBindObject));').addNewLine();
            oFunctCode.addTab(3).add('});').addNewLine();
            oFunctCode.addTab(2).add('}').addNewLine();
            return oFunctCode.toString();
        },

        /**
         *
         */
        _addI18NMatcherFunction: function () {
            var oFunctCode = new StringBuilder();
            oFunctCode.addTab(2).add('_addI18NMatcher: function (aMatchers, aI18NInformations) {').addNewLine();
            oFunctCode.addTab(3).add('aI18NInformations.forEach(function (oBinding) {').addNewLine();
            oFunctCode.addTab(4).add('var oBindObject = {};').addNewLine();
            oFunctCode.addTab(4).add('if (oBinding.key) {').addNewLine();
            oFunctCode.addTab(5).add('oBindObject.modelName = oBinding.key;').addNewLine();
            oFunctCode.addTab(4).add('}').addNewLine();
            oFunctCode.addTab(4).add('if (oBinding.propertyName) {').addNewLine();
            oFunctCode.addTab(5).add('oBindObject.path = oBinding.propertyName;').addNewLine();
            oFunctCode.addTab(4).add('}').addNewLine();
            oFunctCode.addTab(4).add('if (oBinding.parameters) {').addNewLine();
            oFunctCode.addTab(5).add('oBindObject.propertyPath = oBinding.parameters;').addNewLine();
            oFunctCode.addTab(4).add('}').addNewLine();
            oFunctCode.addTab(4).add('aMatchers.push(new I18NText(oBindObject));').addNewLine();
            oFunctCode.addTab(3).add('});').addNewLine();
            oFunctCode.addTab(2).add('}').addNewLine();
            return oFunctCode.toString();
        },

        /**
         * 
         */
        _addAttributeMatcherFunction: function () {
            var oFunctCode = new StringBuilder();
            oFunctCode.addTab(2).add('_addAttributeMatcher: function (aMatchers, aAttributeInformations) {').addNewLine();
            oFunctCode.addTab(3).add('aAttributeInformations.forEach(function (el) {').addNewLine();
            oFunctCode.addTab(4).add('aMatchers.push(new PropertyStrictEquals({').addNewLine();
            oFunctCode.addTab(5).add('name: Object.keys(el)[0],').addNewLine();
            oFunctCode.addTab(5).add('value: Object.values(el)[0]').addNewLine();
            oFunctCode.addTab(4).add('}));').addNewLine();
            oFunctCode.addTab(3).add('});').addNewLine();
            oFunctCode.addTab(2).add('}').addNewLine();
            return oFunctCode.toString();
        },
        //#endregion

        /**
         *
         */
        __generateDependencies: function () {
            var oDependencies = new StringBuilder();

            oDependencies.addTab().add('"sap/ui/test/Opa5",').addNewLine();
            oDependencies.addTab().add('"').add(this.__namespace.replace(/\./g, '/')).add('/<testPath>/MockServer"');

            if (this._bindMatcher) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/matcher/BindingPath"');
            }
            if (this._i18nMatcher) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/matcher/I18NText"');
            }
            if (this._attMatcher) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/matcher/PropertyStrictEquals"');
            }
            if (this._aggEmptyMatcher) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/matcher/AggregationEmpty"');
            }
            if (this._aggFilledMatcher) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/matcher/AggregationFilled"');
            }
            if (this._aggCountMatcher) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/matcher/AggregationLengthEquals"');
            }
            if (this._enterTextAction) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/actions/EnterText"');
            }
            if (this._pressAction) {
                oDependencies.add(',').addNewLine();
                oDependencies.addTab().add('"sap/ui/test/actions/Press"');
            }

            oDependencies.addNewLine();
            oDependencies.add('], function(Opa5, MockServer');

            if (this._bindMatcher) {
                oDependencies.add(', BindingPath');
            }

            if (this._i18nMatcher) {
                oDependencies.add(', I18NText');
            }

            if (this._attMatcher) {
                oDependencies.add(', PropertyStrictEquals');
            }

            if (this._aggEmptyMatcher) {
                oDependencies.add(', AggregationEmpty');
            }

            if (this._aggFilledMatcher) {
                oDependencies.add(', AggregationFilled');
            }

            if (this._aggCountMatcher) {
                oDependencies.add(', AggregationLengthEquals');
            }

            if (this._enterTextAction) {
                oDependencies.add(', EnterText');
            }

            if (this._pressAction) {
                oDependencies.add(', Press');
            }

            oDependencies.add('){').addNewLine();
            return oDependencies.toString();
        },

        /**
         * 
         */
        __generatePageObjectsHeader: function () {
            var oPageHeader = new StringBuilder();
            var opa5Dependency = Object.values(this.__dependencies).filter(dep => dep.asyncDep === 'sap/ui/test/Opa5')[0].paraDep;
            oPageHeader.addTab(2).add(opa5Dependency).add('.createPageObjects({').addNewLine();
            oPageHeader.addTab(3).add('on').add(this.__viewName).add(': {').addNewLine();
            oPageHeader.addTab(4).add('baseClass: ').add(this.__baseClass).add(',').addNewLine();
            if (this.__viewName !== 'Detached') {
                oPageHeader.addTab(4).add('viewName: "').add(this.__viewName).add('",').addNewLine();
            }

            return oPageHeader.toString();
        },

        /**
         *
         */
        __generatePageObjectsHeaderClosing: function () {
            var oPageHeaderClosing = new StringBuilder();
            oPageHeaderClosing.addTab(3).add('}').addNewLine();
            oPageHeaderClosing.addTab(2).add('});').addNewLine();
            return oPageHeaderClosing.toString();
        }
    });
});