import opaTest from "sap/ui/test/opaQunit";
import OverviewPage from "./pages/OverviewPage";
import DetailPage from "./pages/DetailPage";

const onTheOverviewPage = new OverviewPage();
const onTheDetailPage = new DetailPage();

QUnit.module("CoE Demo");

opaTest("Test CoE Demo", function() {

  // Arrangements
  onTheOverviewPage.iStartMyUIComponent({
     componentConfig: {
         name: "de.passau.coedemo.view"
     }
  });

    // Action: Search for elements with ACME within it's name or supplier name
    onTheOverviewPage.xxx();

    // Action: 
    onTheOverviewPage.xxx();

    // Action: 
    onTheOverviewPage.xxx();

    // Assertion: 
    onTheDetailPage.xxx();

    // Action: 
    onTheDetailPage.xxx();


  // Cleanup
  onTheDetailPage.iTeardownMyApp();
});