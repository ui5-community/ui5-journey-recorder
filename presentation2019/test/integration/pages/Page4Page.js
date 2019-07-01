sap.ui.define([
	"sap/ui/demo/todo/test/integration/Common",
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function (Common, Opa5, PropertyStrictEquals ) {
	"use strict";

	Opa5.createPageObjects({
		onPage4: {
			baseClass: Common,
			viewName: "Page4",
			assertions: {
				iShouldSeeTheProperty: function(oMatchProperties) {
					var checkObject = {};
					if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}
					if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}
					checkObject.visible = true;
					checkObject.success = function() {Opa5.assert.ok(true,"Found field matching all properties");};
					checkObject.errorMessage = "Won't be able to find field with requirements: " + JSON.stringify(oMatchProperties);
					checkObject.matchers =
					oMatchProperties.attributes ?
						oMatchProperties.attributes.map(function(el) {
							return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});
						}) : [];
					return this.waitFor(checkObject);
				}
			}
		}
	});
});