sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/test/integration/Common",
	"sap/ui/demo/todo/test/integration/UI5con_2019_Test_1",
	"sap/ui/demo/todo/test/integration/pages/Page3Page",
	"sap/ui/demo/todo/test/integration/pages/Page4Page"
], function(Opa5, Common) {
	"use strict";

	Opa5.extendConfig({
		viewNamespace: "sap.ui.demo.todo.view",
		arrangements: new Common(),
		pollingInterval: 1
	});

});
