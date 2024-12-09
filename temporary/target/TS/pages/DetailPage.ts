
import Opa5 from "sap/ui/test/Opa5";
import Press from "sap/ui/test/actions/Press";

const viewName = "de.passau.coedemo.view.Detail";

export default class DetailPage extends Opa5 {
    // Actions 
    iPressTheButton(oSelector: Record<string, unknown>) {
        this.waitFor(Object.assign({
            
			actions: new Press(),
            viewName,
            success: () => {
                Opa5.assert.ok(true, "Successfull executed 'Press' on 'Button' with id: '__button0'");
            },
            errorMessage: "Failed to Press, Button with id: '__button0'"
        }, oSelector));
    }
    // Assertions-comment 
    iShouldSeeTheRatingIndicator(oSelector: Record<string, unknown>) {
        this.waitFor(Object.assign({
            
            viewName,
            success: () => {
                Opa5.assert.ok(true, "Found RatingIndicator with id: '__indicator0'");
            },
            errorMessage: "Failed to find RatingIndicator with id: '__indicator0'"
        }, oSelector));
    }
}