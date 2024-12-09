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
		
       // Action Search for elements with ACME within it's name or supplier name 
        When.onTheOverview.iType_ACME_IntoTheSearchField({
		  "id": "__component0---overview--srchList"
		});
        
       // Action  
        When.onTheOverview.iType_Mil_IntoTheSearchField({
		  "id": "__component0---overview--srchList"
		});
        
       // Action  
        When.onTheOverview.iPressTheColumnListItem({
		  "controlType": "sap.m.ColumnListItem",
		  "viewName": "de.passau.coedemo.view.Overview",
		  "viewId": "__component0---overview",
		  "properties": {
		    "type": "Navigation"
		  }
		});
        
       // Assertion  
        Then.onTheDetail.iShouldSeeTheRatingIndicator({
		  "controlType": "sap.m.RatingIndicator",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "properties": {
		    "value": 4
		  }
		});
        
       // Action  
        When.onTheDetail.iPressTheButton({
		  "controlType": "sap.m.Button",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "i18NText": {
		    "propertyName": "text",
		    "key": "productRatingButton"
		  }
		});
        
		// Cleanup
		Then.iTeardownMyApp();
	});
});