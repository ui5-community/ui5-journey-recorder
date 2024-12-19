
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
						actions: new EnterText({text: "ACME", pressEnterKey: true }),
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "Successfull executed entered text 'ACME' into 'SearchField' with id: '__component0---overview--srchList'");
						},
						errorMessage: "Failed to enter ACME into SearchField with id: '__component0---overview--srchList'"
					}, {
					  "id": "__component0---overview--srchList"
					}));
				},
			
				iType_Mil_IntoTheSearchField: function () {
					return this.waitFor(Object.assign({ 
						actions: new EnterText({text: "Mil", pressEnterKey: true }),
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "Successfull executed entered text 'Mil' into 'SearchField' with id: '__component0---overview--srchList'");
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
							Opa5.assert.ok(true, "Successfull executed clicked on 'ColumnListItem' with id: '__item0-__component0---overview--invoiceList-0'");
						},
						errorMessage: "Failed to click, ColumnListItem with id: '__item0-__component0---overview--invoiceList-0'"
					}, {
					  "controlType": "sap.m.ColumnListItem",
					  "viewName": "de.passau.coedemo.view.Overview",
					  "viewId": "__component0---overview",
					  "properties": {
					    "type": "Navigation"
					  }
					}));
				},
			}
		}
	});
});