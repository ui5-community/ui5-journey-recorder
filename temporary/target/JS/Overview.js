sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5){
	"use strict";

	Opa5.createPageObject({
		onTheOverviewPage: {
			actions: {
		  	iType_ACME_IntoTheSearchField: function (oSelector) { return this.waitFor({ ...oSelector }); },
		  	iType_Mil_IntoTheSearchField: function (oSelector) { return this.waitFor({ ...oSelector }); },
		  	iPressTheColumnListItem: function (oSelector) { return this.waitFor({ ...oSelector }); }
		  },
			assertions: {}
		}
	});
});