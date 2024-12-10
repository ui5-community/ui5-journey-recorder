
import Opa5 from "sap/ui/test/Opa5";
import Press from "sap/ui/test/actions/Press";

const viewName = "de.passau.coedemo.view.Detail";

export default class DetailPage extends Opa5 {
	
	iPressTheButton(oSelector: Record<string, unknown>) {
		this.waitFor(Object.assign({ 
			actions: new Press(),
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
		}, oSelector));
	}
	
	iShouldSeeTheRatingIndicator(oSelector: Record<string, unknown>) {
		this.waitFor(Object.assign({ 
			viewName,
			success: () => {
				Opa5.assert.ok(true, "{{message-success}}");
			},
			errorMessage: "{{message-error}}"
		}, oSelector));
	}
}