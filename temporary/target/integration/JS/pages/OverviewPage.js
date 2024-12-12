
sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/actions/Press"
], function (Opa5, EnterText, Press) {
	"use strict";

	const theViewName = "de.passau.coedemo.view.Overview";

	Opa5.createPageObjects({
		onTheOverviewPage: { 
			actions: {
				iType_ACME_IntoTheSearchField: function () {
					return this.waitFor(Object.assign({ 
						actions: new EnterText(),
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "{{message-success}}");
						},
						errorMessage: "Failed to enter ACME into SearchField with id: '__component0---overview--srchList'"
					}, {
					  "id": "__component0---overview--srchList"
					}));
				},

				iType_Mil_IntoTheSearchField: function () {
					return this.waitFor(Object.assign({ 
						actions: new EnterText(),
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "{{message-success}}");
						},
						errorMessage: "Failed to enter Mil into SearchField with id: '__component0---overview--srchList'"
					}, {
					  "id": "__component0---overview--srchList"
					}));
				},

				iPressTheColumnListItem: function () {
					return this.waitFor(Object.assign({ 
						actions: new Press(),
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "{{message-success}}");
						},
						errorMessage: "Failed to Press, ColumnListItem with id: '__item0-__component0---overview--invoiceList-0'"
					}, {
					  "controlType": "sap.m.ColumnListItem",
					  "viewName": "de.passau.coedemo.view.Overview",
					  "viewId": "__component0---overview",
					  "properties": {
					    "type": "Navigation"
					  }
					}));
				}
			}
		}
	});
});