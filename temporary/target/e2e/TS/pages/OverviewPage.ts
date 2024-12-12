import { wdi5Selector } from "wdio-ui5-service";
import Page from "./Page";
import SearchField from "sap/m/SearchField";
import ColumnListItem from "sap/m/ColumnListItem";


class Overview extends Page {
    _viewName = "de.passau.coedemo.view.Overview";

    async open() {
        await super.open("#");
    }

	async iType_ACME_IntoTheSearchField() {
		 const oSelector: wdi5Selector = {
					  "id": "__component0---overview--srchList"
					};
		 const oControl = await browser.asControl<SearchField>(oSelector);
		 await oControl.enterText("ACME");
	}

	async iType_Mil_IntoTheSearchField() {
		 const oSelector: wdi5Selector = {
					  "id": "__component0---overview--srchList"
					};
		 const oControl = await browser.asControl<SearchField>(oSelector);
		 await oControl.enterText("Mil");
	}

	async iPressTheColumnListItem() {
		 const oSelector: wdi5Selector = {
					  "controlType": "sap.m.ColumnListItem",
					  "viewName": "de.passau.coedemo.view.Overview",
					  "viewId": "__component0---overview",
					  "properties": {
					    "type": "Navigation"
					  }
					};
		 const oControl = await browser.asControl<ColumnListItem>(oSelector);
		 await oControl.press();
	}

}

export default new Overview();