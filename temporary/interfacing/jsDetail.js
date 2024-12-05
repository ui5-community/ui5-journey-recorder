sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5){
	"use strict";

	Opa5.createPageObject({
		onTheDetailPage: {
			actions: {
		  	iPressTheButton: function (oSelector) { return this.waitFor({ ...oSelector }); }
		  },
			assertions: {
		  	iShouldSeeTheRatingIndicator: function (oSelector) { return this.waitFor({ ...oSelector }); }
		  }
		}
	});
});