sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
	"use strict";
	return UIComponent.extend("sap.ui.demo.todo.Component", {
		metadata: {
			manifest: "json"
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();

			var oModelData = {
				dDate: new Date(),
				siteNum: 0,
				slideSequence: [
					"start",
					"page1",
					"page2",
					"page3",
					"page4",
					"end"
				],
			};
			this.setModel(new JSONModel(oModelData));
		}
	});
});
