sap.ui.define([
	"sap/ui/demo/todo/test/integration/Common",
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/actions/Press",
	"sap/ui/demo/todo/test/integration/customMatcher/ItemBindingMatcher"
], function (Common, Opa5, EnterText, PropertyStrictEquals, Press, ItemBindingMatcher ) {
	"use strict";

	Opa5.createPageObjects({
		onPage3: {
			baseClass: Common,
			viewName: "Page3",
			actions: {
				press: function(oActionProperties) {
					var actionObject = {};
					if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}
					if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}
					actionObject.visible = true;
					actionObject.actions = [new Press()];
					actionObject.success = function() {Opa5.assert.ok(true, "Press successful.")};
					actionObject.errorMessage = "Failed to click";
					actionObject.matchers =
					oActionProperties.attributes ?
						oActionProperties.attributes.map(function(el) {
							return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});
						}) : [];
					if (oActionProperties.bndg_cntxt && oActionProperties.bndg_cntxt.length > 0) {
						oActionProperties.bndg_cntxt.forEach(function(el) {
							actionObject.matchers.push(new ItemBindingMatcher({modelName: el.contextName, propertyName: el.contextAttr, propertyValue: el.targetValue}));
						});
					}
					return this.waitFor(actionObject);
				},
				enterText: function(oActionProperties) {
					var actionObject = {};
					if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}
					if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}
					actionObject.visible = true;
					actionObject.actions = [new EnterText({text: oActionProperties.actionText})];
					actionObject.success = function() {Opa5.assert.ok(true, "Text: " + oActionProperties.actionText + ", successfully inserted.");};
					actionObject.errorMessage = "Failed to insert " + oActionProperties.actionText;
					actionObject.matchers =
					oActionProperties.attributes ?
						oActionProperties.attributes.map(function(el) {
							return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});
						}) : [];
					if (oActionProperties.bndg_cntxt && oActionProperties.bndg_cntxt.length > 0) {
						oActionProperties.bndg_cntxt.forEach(function(el) {
							actionObject.matchers.push(new ItemBindingMatcher({modelName: el.contextName, propertyName: el.contextAttr, propertyValue: el.targetValue}));
						});
					}
					return this.waitFor(actionObject);
				}
			},
			assertions: {
			}
		}
	});
});