
import opaTest from "sap/ui/test/opaQunit";
import OverviewPage from "./pages/OverviewPage";
import DetailPage from "./pages/DetailPage";

const onTheOverviewPage = new OverviewPage();
const onTheDetailPage = new DetailPage();

QUnit.module("CodeGen-Demo");

opaTest("CodeGen-Demo", function () {
	// Arrangements
	onTheOverviewPage.iStartMyUIComponent({
		componentConfig: {
			name: "de.passau.coedemo.view"
		}
	});
	

	// Action Search for elements with ACME within it's name or supplier name 
	onTheOverviewPage.iType_ACME_IntoTheSearchField({
		  "id": "__component0---overview--srchList"
		});


	// Action  
	onTheOverviewPage.iType_Mil_IntoTheSearchField({
		  "id": "__component0---overview--srchList"
		});


	// Action  
	onTheOverviewPage.iPressTheColumnListItem({
		  "controlType": "sap.m.ColumnListItem",
		  "viewName": "de.passau.coedemo.view.Overview",
		  "viewId": "__component0---overview",
		  "properties": {
		    "type": "Navigation"
		  }
		});


	// Assertion  
	onTheDetailPage.iShouldSeeTheRatingIndicator({
		  "controlType": "sap.m.RatingIndicator",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "properties": {
		    "value": 4
		  }
		});


	// Action  
	onTheDetailPage.iPressTheButton({
		  "controlType": "sap.m.Button",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "i18NText": {
		    "propertyName": "text",
		    "key": "productRatingButton"
		  }
		});

	// Cleanup
	onTheOverviewPage.iTeardownMyApp();
});