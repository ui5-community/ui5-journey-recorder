sap.ui.define([
    "com/ui5/testing/model/code-generation/opa5/PageBuilder",
    "com/ui5/testing/util/StringBuilder"
], function (PageBuilder, StringBuilder) {
    "use strict";

    return PageBuilder.extend("com.ui5.testing.model.code-generation.opa5.ViewBuilder", {
        /**
         *
         */
        generate: function () {
            //add the common page as general dependency
            this.__dependencies.unshift({
                asyncDep: this.__namespace.replace(/\./g, '/') + '/<testPath>/' + this.__baseClass,
                paraDep: 'Common'
            });

            //this.__enhanceDependencies();

            var oCode = new StringBuilder('sap.ui.define([').addNewLine();
            oCode.add(this.__generateDependencies());
            oCode.addTab().add('"use strict";').addNewLine(2);
            oCode.add(this.__generatePageObjectsHeader());
            //precheck if actions are necessary to render
            var aActionsToRender = Object.keys(this._actions).filter(function (oAK) {
                return this._actions[oAK].render;
            }.bind(this));
            if (aActionsToRender.length > 0) {
                oCode.add(this.__generateActions());
            }
            //precheck if assertions are necessary to render
            var aAssertionsToRender = Object.keys(this._assertions).filter(function (oAK) {
                return this._assertions[oAK].render;
            }.bind(this));
            if (aAssertionsToRender.length > 0) {
                oCode.add(this.__generateAssertions());
            }
            oCode.add(this.__generatePageObjectsHeaderClosing());
            //maybe we need additional code later on, therefore keep this space
            oCode.add('});');
            return oCode.toString();
        },

        /**
         * 
         */
        /* __enhanceDependencies: function () {
            if (this._actions.press.render) {
                this.__dependencies.push({
                    asyncDep: 'sap/ui/test/actions/Press',
                    paraDep: 'Press'
                });
            }

            if (this._actions.enterText.render) {
                this.__dependencies.push({
                    asyncDep: 'sap/ui/test/actions/EnterText',
                    paraDep: 'EnterText'
                });
            }
        }, */

        /**
         * 
         */
        __generatePageObjectsHeader: function () {
            var oPageHeader = new StringBuilder();
            var opa5Dependency = Object.values(this.__dependencies).filter(dep => dep.asyncDep === 'sap/ui/test/Opa5')[0].paraDep;
            oPageHeader.addTab().add(opa5Dependency).add('.createPageObjects({').addNewLine();
            oPageHeader.addTab(2).add('on').add(this.__viewName).add(': {').addNewLine();
            oPageHeader.addTab(3).add('baseClass: ').add(this.__baseClass);
            if (this.__viewName !== 'Detached') {
                oPageHeader.add(',').addNewLine();
                oPageHeader.addTab(3).add('viewName: "').add(this.__viewName).add('"');
            }

            return oPageHeader.toString();
        },

        /**
         *
         */
        __generatePageObjectsHeaderClosing: function () {
            var oPageHeaderClosing = new StringBuilder();
            oPageHeaderClosing.addNewLine();
            oPageHeaderClosing.addTab(2).add('}').addNewLine();
            oPageHeaderClosing.addTab().add('});').addNewLine();
            return oPageHeaderClosing.toString();
        },

        /**
         * 
         */
        __generateDependencies: function () {
            var oDependencies = new StringBuilder();
            this.__dependencies.forEach(dep => oDependencies.addTab().add('\"').add(dep.asyncDep).add('\",').addNewLine());
            oDependencies.replace(',', '');
            oDependencies.add('], function (');
            this.__dependencies.forEach(dep => oDependencies.add(dep.paraDep).add(', '));
            oDependencies.replace(',', '');
            oDependencies.add(') {').addNewLine();
            return oDependencies.toString();
        },

        //#region actions
        /**
         * 
         */
        __generateEnterTextFunction: function () {
            var oExistFunct = new StringBuilder();
            oExistFunct.addTab(4).add('enterTextOn: function(oActionProperties) {').addNewLine();
            oExistFunct.addTab(5).add('return this.enterText(oActionProperties, {').addNewLine();
            oExistFunct.addTab(6).add('success: function() {').addNewLine();
            oExistFunct.addTab(7).add('Opa5.assert.ok(true, "Could enter text at the control at view ').add(this.__viewName).add('");').addNewLine();
            oExistFunct.addTab(6).add('},').addNewLine();
            oExistFunct.addTab(6).add('errorMessage: "Won\'t be able to enter text at the control at the view \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oActionProperties)').addNewLine();
            oExistFunct.addTab(5).add('})').addNewLine();
            oExistFunct.addTab(4).add('}').addNewLine();
            return oExistFunct.toString();
        },

        /**
         * 
         */
        __generatePressFunction: function () {
            var oExistFunct = new StringBuilder();
            oExistFunct.addTab(4).add('clickOn: function(oActionProperties) {').addNewLine();
            oExistFunct.addTab(5).add('return this.press(oActionProperties, {').addNewLine();
            oExistFunct.addTab(6).add('success: function() {').addNewLine();
            oExistFunct.addTab(7).add('Opa5.assert.ok(true, "Could click the control at view ').add(this.__viewName).add('");').addNewLine();
            oExistFunct.addTab(6).add('},').addNewLine();
            oExistFunct.addTab(6).add('errorMessage: "Won\'t be able to click the control at the view \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oActionProperties)').addNewLine();
            oExistFunct.addTab(5).add('})').addNewLine();
            oExistFunct.addTab(4).add('}').addNewLine();
            return oExistFunct.toString();
        },

        /**
         *
         */
        __generateActions: function () {
            var oActions = new StringBuilder();
            oActions.add(',').addNewLine();
            oActions.addTab(3).add('actions: {').addNewLine();
            if (this._actions.press.render) {
                oActions.add(this.__generatePressFunction());
            }
            if (this._actions.enterText.render) {
                oActions.add(this.__generateEnterTextFunction());
            }

            oActions.addTab(3).add('}');
            return oActions.toString();
        },
        //#endregion

        //#region assertions
        /**
         * 
         */
        __generateExistFunction: function () {
            var oExistFunct = new StringBuilder();
            oExistFunct.addTab(4).add('iShouldSeeTheControl: function(oMatchProperties) {').addNewLine();
            oExistFunct.addTab(5).add('return this.exists(oMatchProperties, {').addNewLine();
            oExistFunct.addTab(6).add('success: function() {').addNewLine();
            oExistFunct.addTab(7).add('Opa5.assert.ok(true, "Found the control at view ').add(this.__viewName).add('");').addNewLine();
            oExistFunct.addTab(6).add('},').addNewLine();
            oExistFunct.addTab(6).add('errorMessage: "Won\'t be able to find field at the view \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oMatchProperties)').addNewLine();
            oExistFunct.addTab(5).add('})').addNewLine();
            oExistFunct.addTab(4).add('}').addNewLine();
            return oExistFunct.toString();
        },

        /**
         * 
         */
        __generateAttributesFunction: function () {
            var oExistFunct = new StringBuilder();
            oExistFunct.addTab(4).add('controlShouldHave: function(oMatchProperties) {').addNewLine();
            oExistFunct.addTab(5).add('return this.hasAttributes(oMatchProperties, {').addNewLine();
            oExistFunct.addTab(6).add('success: function() {').addNewLine();
            oExistFunct.addTab(7).add('Opa5.assert.ok(true, "Found the control at view ').add(this.__viewName).add(' with given attributes");').addNewLine();
            oExistFunct.addTab(6).add('},').addNewLine();
            oExistFunct.addTab(6).add('errorMessage: "Won\'t be able to find control at \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oMatchProperties)').addNewLine();
            oExistFunct.addTab(5).add('})').addNewLine();
            oExistFunct.addTab(4).add('}').addNewLine();
            return oExistFunct.toString();
        },

        /**
         * 
         */
        __generateAggregationEmpty: function () {
            var oAggCntFnct = new StringBuilder();
            oAggCntFnct.addTab(4).add('aggregationShouldBeEmpty: function(oMatchProperties) {').addNewLine();
            oAggCntFnct.addTab(5).add('return this.aggregationEmpty(oMatchProperties, {').addNewLine();
            oAggCntFnct.addTab(6).add('success: function() {').addNewLine();
            oAggCntFnct.addTab(7).add('Opa5.assert.ok(true, "The aggregation at view \'').add(this.__viewName).add('\' is empty");').addNewLine();
            oAggCntFnct.addTab(6).add('},').addNewLine();
            oAggCntFnct.addTab(6).add('errorMessage: "Won\'t be able to find control with empty aggregation \'" + oMatchProperties.aggName + " at \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oMatchProperties)').addNewLine();
            oAggCntFnct.addTab(5).add('})').addNewLine();
            oAggCntFnct.addTab(4).add('}').addNewLine();
            return oAggCntFnct.toString();
        },

        /**
         * 
         */
        __generateAggregationFilled: function () {
            var oAggCntFnct = new StringBuilder();
            oAggCntFnct.addTab(4).add('aggregationShouldBeFilled: function(oMatchProperties) {').addNewLine();
            oAggCntFnct.addTab(5).add('return this.aggregationFilled(oMatchProperties, {').addNewLine();
            oAggCntFnct.addTab(6).add('success: function() {').addNewLine();
            oAggCntFnct.addTab(7).add('Opa5.assert.ok(true, "The aggregation at view \'').add(this.__viewName).add('\' is filled");').addNewLine();
            oAggCntFnct.addTab(6).add('},').addNewLine();
            oAggCntFnct.addTab(6).add('errorMessage: "Won\'t be able to find control with filled aggregation \'" + oMatchProperties.aggName + " at \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oMatchProperties)').addNewLine();
            oAggCntFnct.addTab(5).add('})').addNewLine();
            oAggCntFnct.addTab(4).add('}').addNewLine();
            return oAggCntFnct.toString();
        },

        /**
         * 
         */
        __generateAggregationCount: function () {
            var oAggCntFnct = new StringBuilder();
            oAggCntFnct.addTab(4).add('aggregationLengthShouldBe: function(oMatchProperties) {').addNewLine();
            oAggCntFnct.addTab(5).add('return this.aggregationCount(oMatchProperties, {').addNewLine();
            oAggCntFnct.addTab(6).add('success: function() {').addNewLine();
            oAggCntFnct.addTab(7).add('Opa5.assert.ok(true, "The aggregation at view \'').add(this.__viewName).add('\' has an exact count of " + oMatchProperties.count + ".");').addNewLine();
            oAggCntFnct.addTab(6).add('},').addNewLine();
            oAggCntFnct.addTab(6).add('errorMessage: "Won\'t be able to find control with aggregation \'" + oMatchProperties.aggName + "\' and count \'" + oMatchProperties.count + "\' at \'').add(this.__viewName).add('\' with requirements: " + JSON.stringify(oMatchProperties)').addNewLine();
            oAggCntFnct.addTab(5).add('})').addNewLine();
            oAggCntFnct.addTab(4).add('}').addNewLine();
            return oAggCntFnct.toString();
        },

        /**
         *
         */
        __generateAssertions: function () {
            var oAssertions = new StringBuilder();
            oAssertions.add(',').addNewLine();
            oAssertions.addTab(3).add('assertions: {').addNewLine();
            if (this._assertions.exists.render) {
                oAssertions.add(this.__generateExistFunction());
            }
            if (this._assertions.attributes.render) {
                oAssertions.add(this.__generateAttributesFunction());
            }
            if (this._assertions.aggregationEmpty.render) {
                oAssertions.add(this.__generateAggregationEmpty());
            }
            if (this._assertions.aggregationFilled.render) {
                oAssertions.add(this.__generateAggregationFilled());
            }
            if (this._assertions.aggregationCount.render) {
                oAssertions.add(this.__generateAggregationCount());
            }

            oAssertions.addTab(3).add('}');
            return oAssertions.toString();
        }
        //#endregion
    });
});