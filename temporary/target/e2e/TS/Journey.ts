import Overview from "./pages/Overview";
import Detail from "./pages/Detail";


describe("CodeGen-Demo", () => {
    before(async () => {
        await Overview.open();
    }); 
    
    it("CodeGen-Demo", async () => {
		// Action: Search for elements with ACME within it's name or supplier name
		Overview.iType_ACME_IntoTheSearchField();

		// Action
		Overview.iType_Mil_IntoTheSearchField();

		// Action
		Overview.iPressTheColumnListItem();

		// Assertion
		Detail.iShouldSeeTheRatingIndicator();

		// Action
		Detail.iPressTheButton();
    });
});