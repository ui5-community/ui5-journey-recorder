const { wdi5 } = require("wdio-ui5-service");

class Overview extends Page {
    _viewName = "de.passau.coedemo.view.Overview";
    
    async open() {
        wdi5.goTo("#");
    }

	async iType_ACME_IntoTheSearchField() {
		 const oControl = await browser.asControl({
					  "id": "__component0---overview--srchList"
					});
		 await oControl.enterText("ACME");
	}

	async iType_Mil_IntoTheSearchField() {
		 const oControl = await browser.asControl({
					  "id": "__component0---overview--srchList"
					});
		 await oControl.enterText("Mil");
	}

	async iPressTheColumnListItem() {
		 const oControl = await browser.asControl({
					  "controlType": "sap.m.ColumnListItem",
					  "viewName": "de.passau.coedemo.view.Overview",
					  "viewId": "__component0---overview",
					  "properties": {
					    "type": "Navigation"
					  }
					});
		 await oControl.press();
	}

}
    
module.exports = new Overview();