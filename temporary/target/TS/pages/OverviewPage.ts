import Opa5 from "sap/ui/test/Opa5";
import EnterText from "sap/ui/test/actions/EnterText;
import Press from "sap/ui/test/actions/Press;

const viewName = "de.passau.coedemo.view.Overview";

export default class OverviewPage extends Opa5 {
	// Actions 

   iType_ACME_IntoTheSearchField(oSelector) {
        this.waitFor(Object.assign({ 
			actions: new EnterText(),
            viewName,
            success: () => {
                Opa5.assert.ok(true, "Successfull executed entered into '.SearchField' with id: '__component0---overview--srchList' and Text: 'ACME'");
            },
            errorMessage: "Failed to enter ACME into .SearchField with id: '__component0---overview--srchList'",
        }, oSelector));
    }

   iType_Mil_IntoTheSearchField(oSelector) {
        this.waitFor(Object.assign({ 
			actions: new EnterText(),
            viewName,
            success: () => {
                Opa5.assert.ok(true, "Successfull executed entered into '.SearchField' with id: '__component0---overview--srchList' and Text: 'Mil'");
            },
            errorMessage: "Failed to enter Mil into .SearchField with id: '__component0---overview--srchList'",
        }, oSelector));
    }

   iPressTheColumnListItem(oSelector) {
        this.waitFor(Object.assign({ 
			actions: new Press(),
            viewName,
            success: () => {
                Opa5.assert.ok(true, "Successfull executed 'Press' on '.ColumnListItem' with id: '__item0-__component0---overview--invoiceList-0'");
            },
            errorMessage: "Failed to Press, .ColumnListItem with id: '__item0-__component0---overview--invoiceList-0'",
        }, oSelector));
    }
	
}