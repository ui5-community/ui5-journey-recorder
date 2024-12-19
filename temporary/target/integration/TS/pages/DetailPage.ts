
import Opa5 from "sap/ui/test/Opa5";
import Press from "sap/ui/test/actions/Press";

const viewName = "de.passau.coedemo.view.Detail";

export default class DetailPage extends Opa5 {
	
	iPressTheButton() {
		this.waitFor(Object.assign({ 
			actions: new Press(),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "Successfull executed clicked on 'Button' with id: '__button0'");
			},
			errorMessage: "Failed to click, Button with id: '__button0'"
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
				Opa5.assert.ok(true, "Found RatingIndicator with id: '__indicator0'");
			},
			errorMessage: "Failed to find RatingIndicator with id: '__indicator0'"
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