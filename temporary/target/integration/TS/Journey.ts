
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
			name: "de.passau.coedemo"
		}
	});
	
	// Action: Search for elements with ACME within it's name or supplier name 
	onTheOverviewPage.iType_ACME_IntoTheSearchField();

	// Action 
	onTheOverviewPage.iType_Mil_IntoTheSearchField();

	// Action 
	onTheOverviewPage.iPressTheColumnListItem();

	// Assertion 
	onTheDetailPage.iShouldSeeTheRatingIndicator();

	// Action 
	onTheDetailPage.iPressTheButton();

	// Cleanup
	onTheOverviewPage.iTeardownMyApp();
});