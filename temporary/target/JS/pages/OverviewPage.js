
sap.ui.define([
    "sap/ui/test/Opa5",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/actions/Press"
], function (Opa5, EnterText, Press) {
    "use strict";

    const theViewName = "de.passau.coedemo.view.Overview";

    Opa5.createPageObjects({
        onTheOverviewPage: { 
			actions: { 
    iType_ACME_IntoTheSearchField: function (oSelector) {
        return this.waitFor(Object.assign({
            
						actions: new EnterText(),
            viewName: theViewName,
            success: function () {
                Opa5.assert.ok(true, "Successfull executed entered text 'ACME' into 'SearchField' with id: '__component0---overview--srchList'");
            },
            errorMessage: "{{error-message}}"
        }, oSelector));
    },
    iType_Mil_IntoTheSearchField: function (oSelector) {
        return this.waitFor(Object.assign({
            
						actions: new EnterText(),
            viewName: theViewName,
            success: function () {
                Opa5.assert.ok(true, "Successfull executed entered text 'Mil' into 'SearchField' with id: '__component0---overview--srchList'");
            },
            errorMessage: "{{error-message}}"
        }, oSelector));
    },
    iPressTheColumnListItem: function (oSelector) {
        return this.waitFor(Object.assign({
            
						actions: new Press(),
            viewName: theViewName,
            success: function () {
                Opa5.assert.ok(true, "Successfull executed 'Press' on 'ColumnListItem' with id: '__item0-__component0---overview--invoiceList-0'");
            },
            errorMessage: "{{error-message}}"
        }, oSelector));
    },
			}
        }
    });
});