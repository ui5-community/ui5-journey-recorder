sap.ui.define(["sap/ui/base/Object"],
	function (BaseObject) {
		"use strict";

		var ItemConstants = BaseObject.extend("com.ui5.testing.util.ItemConstants");

		ItemConstants.define = function (name, value) {
			Object.defineProperty(com.ui5.testing.util.ItemConstants, name
				.toUpperCase(), {
				"value": value,
				"writable": false,
				"configurable": false
			});
		};

		ItemConstants.define("ATTRIBUTE", "ATTR");
		ItemConstants.define("BINDING", "BNDG");
		ItemConstants.define("LUMIRA", "LUMIRA");
		ItemConstants.define("CONTEXT", "CNTX");
		ItemConstants.define("I18N", "I18N");
		ItemConstants.define("METADATA", "MTA");

		return ItemConstants;
	});