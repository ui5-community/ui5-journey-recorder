/* global QUnit */
sap.ui.define([
  "sap/ui/test/opaQunit",
  "./pages/Overview",
  "./pages/Detail"
], function(opaTest) {
  "use strict";

  QUnit.module("CoE Demo");

  opaTest("Test CoE Demo", function(Given, When, Then) {
      // Arrangements
      Given.iStartMyUIComponent({
         componentConfig: {
             name: "de.passau.coedemo.view"
         }
      })
   
    // Action: Search for elements with ACME within it's name or supplier name
    When.onTheOverviewPage.iType_ACME_IntoTheSearchField({
		  "id": "__component0---overview--srchList"
		});

    // Action: 
    When.onTheOverviewPage.iType_Mil_IntoTheSearchField({
		  "id": "__component0---overview--srchList"
		});

    // Action: 
    When.onTheOverviewPage.iPressTheColumnListItem({
		  "controlType": "sap.m.ColumnListItem",
		  "viewName": "de.passau.coedemo.view.Overview",
		  "viewId": "__component0---overview",
		  "properties": {
		    "type": "Navigation"
		  }
		});

    // Assertion: 
    Then.onTheDetailPage.iShouldSeeTheRatingIndicator({
		  "controlType": "sap.m.RatingIndicator",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "properties": {
		    "value": 4
		  }
		});

    // Action: 
    When.onTheDetailPage.iPressTheButton({
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