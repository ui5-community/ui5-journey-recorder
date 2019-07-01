sap.ui.define([
	"sap/ui/test/matchers/Matcher"
], function (Matcher) {
	"use strict";

	return Matcher.extend("sap.ui.demo.todo.test.integration.customMatcher.ItemBindingMatcher", {
		metadata: {
			publicMethods: ["isMatching"],
			properties: {
				modelName: {type: "string"},
				propertyName: {type: "string"},
				propertyValue: {type: "string"}
			}
		},

		isMatching: function (oControl) {
			if (!this.getPropertyName()) {
				this._oLogger.error("No propertyName given for Control '" + oControl + "'");
				return false;
			}
			var oBindingContext = oControl.getBindingContext(this.getModelName());
			if (!oBindingContext) {
				this._oLogger.error("No bindingContext found for '" + oControl + "' and modelName " + this.getModelName());
				return false;
			}
			var sPropertyValue = oBindingContext.getObject()[this.getPropertyName()];
			if (!sPropertyValue) {
				this._oLogger.error("No value found for '" + oControl + "',modelName " + this.getModelName() + " and property " + this.getPropertyName());
				return false;
			}
			if (this.getPropertyValue()) {
				if (sPropertyValue === this.getPropertyValue()) {
					return true;
				} else {
					return false;
				}
			} else {
				return true;
			}
		}
	});
});