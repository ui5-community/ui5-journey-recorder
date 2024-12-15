
import Opa5 from "sap/ui/test/Opa5";
import Press from "sap/ui/test/actions/Press";

const viewName = "de.passau.coedemo.view.Detail";

export default class DetailPage extends Opa5 {
	
	iPressTheButton() {
		this.waitFor(Object.assign({ 
			actions: new Press(),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
		}, {
					  "controlType": "sap.m.Button",
					  "viewName": "de.passau.coedemo.view.Detail",
					  "viewId": "__component0---detail",
					  "i18NText": {
					    "propertyName": "text",
					    "key": "productRatingButton"
					  }
					}));
	}
	
	iShouldSeeTheRatingIndicator() {
		this.waitFor(Object.assign({ 
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
		}, {
					  "controlType": "sap.m.RatingIndicator",
					  "viewName": "de.passau.coedemo.view.Detail",
					  "viewId": "__component0---detail",
					  "properties": {
					    "value": 4
					  }
					}));
	}
}