
import Opa5 from "sap/ui/test/Opa5";
import EnterText from "sap/ui/test/actions/EnterText";
import Press from "sap/ui/test/actions/Press";

const viewName = "de.passau.coedemo.view.Overview";

export default class OverviewPage extends Opa5 {
	
	iType_ACME_IntoTheSearchField(oSelector: Record<string, unknown>) {
		this.waitFor(Object.assign({ 
			actions: new EnterText(),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
		}, {
					  "id": "__component0---overview--srchList"
					}));
	}

	iType_Mil_IntoTheSearchField(oSelector: Record<string, unknown>) {
		this.waitFor(Object.assign({ 
			actions: new EnterText(),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
		}, {
					  "id": "__component0---overview--srchList"
					}));
	}

	iPressTheColumnListItem(oSelector: Record<string, unknown>) {
		this.waitFor(Object.assign({ 
			actions: new Press(),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
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