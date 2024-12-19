import { wdi5Selector } from "wdio-ui5-service";
import { wdi5 } from "wdio-ui5-service";
import RatingIndicator from "sap/m/RatingIndicator";
import Button from "sap/m/Button";

class Detail {
    _viewName = "de.passau.coedemo.view.Detail";

    async open() {
        wdi5.goTo("#/detail/Invoices(ProductName%253D'Milk'%252CQuantity%253D4%252CShipperName%253D'ACME')");
    }
	async iPressTheButton() {
		const oSelector: wdi5Selector = {
		  "controlType": "sap.m.Button",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "i18NText": {
		    "propertyName": "text",
		    "key": "productRatingButton"
		  }
		};
		const oControl = await browser.asControl<Button>(oSelector);
		await oControl.press();
	}

	async iShouldSeeTheRatingIndicator() {
		const oSelector: wdi5Selector = {
		  "controlType": "sap.m.RatingIndicator",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "properties": {
		    "value": 4
		  }
		};
		const oControl = await browser.asControl<RatingIndicator>(oSelector);
		// basic existence test, add custom checks as necessary
		expect(oControl).toBeTruthy();
	}

}

export default new Detail();