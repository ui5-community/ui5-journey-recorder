
import Opa5 from "sap/ui/test/Opa5";
import EnterText from "sap/ui/test/actions/EnterText";
import Press from "sap/ui/test/actions/Press";

const viewName = "de.passau.coedemo.view.Overview";

export default class OverviewPage extends Opa5 {
	
	iType_ACME_IntoTheSearchField() {
		this.waitFor(Object.assign({ 
			actions: new EnterText({text: "ACME", pressEnterKey: true }),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "Successfull executed entered text 'ACME' into 'SearchField' with id: '__component0---overview--srchList'");
			},
			errorMessage: "Failed to enter ACME into SearchField with id: '__component0---overview--srchList'"
		}, {
		  "id": "__component0---overview--srchList"
		}));
	}

	iType_Mil_IntoTheSearchField() {
		this.waitFor(Object.assign({ 
			actions: new EnterText({text: "Mil", pressEnterKey: true }),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "Successfull executed entered text 'Mil' into 'SearchField' with id: '__component0---overview--srchList'");
			},
			errorMessage: "Failed to enter Mil into SearchField with id: '__component0---overview--srchList'"
		}, {
		  "id": "__component0---overview--srchList"
		}));
	}

	iPressTheColumnListItem() {
		this.waitFor(Object.assign({ 
			actions: new Press(),
			viewName,
			success: () => {
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
	}
	
}