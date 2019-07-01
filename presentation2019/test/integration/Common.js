sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/demo/todo/localService/mockserver"
], function(Opa5, MockServer) {
	"use strict";

	function _wrapParameters(oParameters) {
		return {
			get: function(name) {
				return (oParameters[name] || "").toString();
			}
		};
	}

	return Opa5.extend("sap.ui.demo.todo.<testPath>.Common", {
		iStartTheAppByHash: function(oParameters) {
			MockServer.init(_wrapParameters(oParameters || {}));
			this.iStartMyUIComponent({
				componentConfig: {
					name: "sap.ui.demo.todo",
					async: true
				},
				hash: oParameters.hash
			});
		},
		iTeardownTheApp: function() {
			this.iTeardownMyUIComponent();
		}
	});
});