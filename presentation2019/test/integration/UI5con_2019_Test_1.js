sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/opaQunit"
], function (Opa5, opaTest) {
	"use strict";

	QUnit.module("UI5 Testrecorder");

	opaTest("UI5con 2019", function(Given, When, Then) {
		Given.iStartTheAppByHash({hash: "/p3"});

		When.onPage3.enterText({controlType: "sap.m.SearchField", id: {value: "searchField",isRegex: false}, actionText: "Car"});
		When.onPage3.press({controlType: "sap.m.SearchField", id: {value: "searchField",isRegex: false}});
		When.onPage3.press({controlType: "sap.m.ColumnListItem", bndg_cntxt: [{ targetValue: "Car VW Golf (white)", contextName: "mainData", contextAttr: "Title"}]});
		Then.onPage4.iShouldSeeTheProperty({controlType: "sap.m.Text", id: {value: "descriptionText",isRegex: false}, attributes: [{text: "Only 160.000 km and in really good shape, grip shift, contact me for appointment and more details."}]});

		Given.iTeardownTheApp();
	});
});