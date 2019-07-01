sap.ui.define([
	"sap/ui/demo/todo/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("sap.ui.demo.todo.controller.Opener", {
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("start").attachPatternMatched(function (oEvent) {
				if (!this.getOwnerComponent().getModel().getProperty('/keysAttached')) {
					this.registerKeyCodes();
					this.getOwnerComponent().getModel().setProperty('/keysAttached', true);
				}
				this.setSlideNumber(oEvent.getParameter('name'));
			}.bind(this));
			this.getView().setModel(new JSONModel({subActive: false}), 'pageOpenView' );
		}
	});
});
