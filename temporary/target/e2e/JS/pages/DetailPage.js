const { wdi5 } = require("wdio-ui5-service");

class Detail {
    _viewName = "de.passau.coedemo.view.Detail";
    
    async open() {
        wdi5.goTo("#/detail/Invoices(ProductName%253D'Milk'%252CQuantity%253D4%252CShipperName%253D'ACME')");
    }
	async iPressTheButton() {
		const oControl = await browser.asControl({
		  "controlType": "sap.m.Button",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "i18NText": {
		    "propertyName": "text",
		    "key": "productRatingButton"
		  }
		});
		await oControl.press();
	}


	async iShouldSeeTheRatingIndicator() {
		const oControl = await browser.asControl({
		  "controlType": "sap.m.RatingIndicator",
		  "viewName": "de.passau.coedemo.view.Detail",
		  "viewId": "__component0---detail",
		  "properties": {
		    "value": 4
		  }
		});
		// basic existence test, add custom checks as necessary
		expect(oControl).toBeTruthy();
	}

}
    
module.exports = new Detail();