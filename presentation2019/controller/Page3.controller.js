sap.ui.define([
	"sap/ui/demo/todo/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/todo/model/formatter",
	"sap/ui/demo/todo/model/FlaggedType",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/m/library'
], function (BaseController, JSONModel, formatter, FlaggedType, Filter, FilterOperator, mobileLibrary) {
	"use strict";

	return BaseController.extend("sap.ui.demo.todo.controller.Page3", {
		types: {
			flagged: new FlaggedType()
		},

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("itemTable");

			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			
			oViewModel = new JSONModel({
				worklistTableTitle: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("worklistTableTitle"),
				tableBusyDelay: 0,
				subActive: false
			});
			this.getView().setModel(oViewModel, 'page3View');


			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			//Presentation related stuff			
			this.getOwnerComponent().getRouter().getRoute("page3").attachPatternMatched(function (oEvent) {
				if (!this.getOwnerComponent().getModel().getProperty('/keysAttached')) {
					this.registerKeyCodes();
					this.getOwnerComponent().getModel().setProperty('/keysAttached', true);
				}
				this.setSlideNumber(oEvent.getParameter('name'));
			}.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 *
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("worklistTableTitle");
			}
			this.getView().getModel('page3View').setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Triggered by the SearchFields's 'search' event
		 * @param {sap.ui.base.Event} oEvent SearchFields's search event
		 * @public
		 */
		onFilterPosts: function (oEvent) {

			// build filter array
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("Title", FilterOperator.Contains, sQuery));
			}

			// filter binding
			var oTable = this.getView().byId("itemTable");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			this.nextSlide({
				// The source is the list item that got pressed
				postId: oEvent.getSource().getBindingContext('mainData').getProperty("PostID")
			});
			/*
			this.getOwnerComponent().getRouter().navTo("page4", {
				// The source is the list item that got pressed
				postId: oEvent.getSource().getBindingContext('mainData').getProperty("PostID")
			});*/
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Sets the item count on the worklist view header
		 * @param {int} iTotalItems the total number of items in the table
		 * @private
		 */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				this.getView().getModel('page3View').setProperty("/worklistTableTitle", sTitle);
			}
		}
	});
});
