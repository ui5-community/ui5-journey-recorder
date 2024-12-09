export const JSMethodTemplate = `
    {{method-name}}: function (oSelector) {
        return this.waitFor(Object.assign({
            {{action-type}}
            viewName: theViewName,
            success: function () {
                Opa5.assert.ok(true, "{{message-success}}");
            },
            errorMessage: "{{error-message}}"
        }, oSelector));
    },{{method-placeholder}}`;
export const JSPageTemplate = `
sap.ui.define([
    "sap/ui/test/Opa5"{{action-import}}
], function (Opa5{{action-class}}) {
    "use strict";

    const theViewName = "{{view-name}}";

    Opa5.createPageObjects({
        onThe{{page-name}}Page: { {{actions-ref}}{{assert-ref}}
        }
    });
});`;
export const TSMethodTemplate = `
    {{method-name}}(oSelector: Record<string, unknown>) {
        this.waitFor(Object.assign({
            {{action-type}}
            viewName,
            success: () => {
                Opa5.assert.ok(true, "{{message-success}}");
            },
            errorMessage: "{{message-error}}"
        }, oSelector));
    }{{method-placeholder}}`;
export const TSPageTemplate = `
import Opa5 from "sap/ui/test/Opa5";{{action-import}}

const viewName = "{{view-name}}";

export default class {{page-name}}Page extends Opa5 {
    {{actions-comment}}
    {{assertions-comment}}
}`;
