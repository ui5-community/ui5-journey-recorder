
sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press"
], function (Opa5, Press) {
	"use strict";

	const theViewName = "de.passau.coedemo.view.Detail";

	Opa5.createPageObjects({
		onTheDetailPage: { 
			actions: {
				iPressTheButton: function (oSelector) {
					return this.waitFor(Object.assign({ 
						actions: new Press(),
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "{{message-success}}");
						},
						errorMessage: "Failed to Press, Button with id: '__button0'"
					}, oSelector));
				}
			},
			assertions: {
				iShouldSeeTheRatingIndicator: function (oSelector) {
					return this.waitFor(Object.assign({ 
						viewName: theViewName,
						success: function () {
							Opa5.assert.ok(true, "{{message-success}}");
						},
						errorMessage: "Failed to find RatingIndicator with id: '__indicator0'"
					}, oSelector));
				}
			}
		}
	});
});