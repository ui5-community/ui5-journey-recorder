
/* global QUnit */
sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/OverviewPage",
	"./pages/DetailPage"
], function (opaTest) {
	"use strict";

	QUnit.module("CodeGen-Demo");

	opaTest("CodeGen-Demo", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "de.passau.coedemo.view"
			}
		});

		
		// Action: Search for elements with ACME within it's name or supplier name 
		When.onTheOverview.iType_ACME_IntoTheSearchField();

		// Action 
		When.onTheOverview.iType_Mil_IntoTheSearchField();

		// Action 
		When.onTheOverview.iPressTheColumnListItem();

		// Assertion 
		Then.onTheDetail.iShouldSeeTheRatingIndicator();

		// Action 
		When.onTheDetail.iPressTheButton();

		// Cleanup
		Then.iTeardownMyApp();
	});
});