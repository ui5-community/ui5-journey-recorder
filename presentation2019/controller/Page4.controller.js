sap.ui.define([
	"sap/ui/demo/todo/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/todo/model/formatter"
], function (BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.todo.controller.Page4", {

		formatter: formatter,

		onInit: function () {
			this.getView().setModel(new JSONModel({
				busy: false,
				subActive: false
			}), 'page4View');

			this.getOwnerComponent().getRouter().getRoute("page4").attachPatternMatched(function (oEvent) {
				if (!this.getOwnerComponent().getModel().getProperty('/keysAttached')) {
					this.registerKeyCodes();
					this.getOwnerComponent().getModel().setProperty('/keysAttached', true);
				}
				this.setSlideNumber(oEvent.getParameter('name'));

				this._onPostMatched(oEvent);
			}.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Navigates back to the worklist
		 * @function
		 */
		onNavBack: function () {
			this.priorSlide();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the post path.
		 *
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onPostMatched: function (oEvent) {
			var oViewModel = this.getView().getModel('page4View'),
				oDataModel = this.getView().getModel('mainData');

			this.getView().bindElement({
				path: "/Posts('" + oEvent.getParameter("arguments").postId + "')",
				model: 'mainData',
				events: {
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		}
	});
});
