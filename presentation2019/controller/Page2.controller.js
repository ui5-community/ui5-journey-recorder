sap.ui.define([
	"sap/ui/demo/todo/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("sap.ui.demo.todo.controller.Page2", {
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("page2").attachPatternMatched(function (oEvent) {
				if (!this.getOwnerComponent().getModel().getProperty('/keysAttached')) {
					this.registerKeyCodes();
					this.getOwnerComponent().getModel().setProperty('/keysAttached', true);
				}
				this.setSlideNumber(oEvent.getParameter('name'));
			}.bind(this));
			this.getView().setModel(new JSONModel({
				subNav: 0,
				maxSub: 1,
				subActive: true
			}), 'page2View');
			this.registerSubCodes();
		},

		_slideUp: function() {
			var index = this.getView().getModel('page2View').getProperty('/subNav');
			if (index > 0) {
				index = index - 1;
				this.getView().getModel('page2View').setProperty('/subNav', index);
			}
		},

		_slideDown: function() {
			var index = this.getView().getModel('page2View').getProperty('/subNav');
			var max = this.getView().getModel('page2View').getProperty('/maxSub');
			if (index < max) {
				index = index + 1;
				this.getView().getModel('page2View').setProperty('/subNav', index);
			}
		},

		registerSubCodes: function () {
			$(document).keydown(function (oEvt) {
				if (!this.getView().getDomRef().classList.contains("sapMNavItemHidden")) {
					switch (oEvt.keyCode) {
						case 38: // 'ArrowUp'
							this._slideUp();
							break;
						case 40: //'ArrowDown'
							this._slideDown();
							break;
						default:
					}
				}
			}.bind(this));
		}
	});
});
