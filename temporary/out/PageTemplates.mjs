// sry for the exceptional amount of tabulator signs, we need them for formatting
export const JSMethodTemplate = `
\t\t\t\t{{method-name}}: function (oSelector) {
\t\t\t\t\treturn this.waitFor(Object.assign({ {{action-create}}
\t\t\t\t\t\tviewName: theViewName,
\t\t\t\t\t\tsuccess: function () {
\t\t\t\t\t\t\tOpa5.assert.ok(true, "{{message-success}}");
\t\t\t\t\t\t},
\t\t\t\t\t\terrorMessage: "{{error-message}}"
\t\t\t\t\t}, oSelector));
\t\t\t\t}`;
export const JSPageTemplate = `
sap.ui.define([
\t"sap/ui/test/Opa5"{{action-import}}
], function (Opa5{{action-class}}) {
\t"use strict";

\tconst theViewName = "{{view-name}}";

\tOpa5.createPageObjects({
\t\tonThe{{page-name}}Page: { {{actions-ref}}{{assert-ref}}
\t\t}
\t});
});`;
export const JSImportTemplate = `\t"sap/ui/test/actions/{{action-class}}"`;
export const TSMethodTemplate = `
\t{{method-name}}(oSelector: Record<string, unknown>) {
\t\tthis.waitFor(Object.assign({ {{action-create}}
\t\t\tviewName,
\t\t\tsuccess: () => {
\t\t\t\tOpa5.assert.ok(true, "{{message-success}}");
\t\t\t},
\t\t\terrorMessage: "{{message-error}}"
\t\t}, oSelector));
\t}`;
export const TSPageTemplate = `
import Opa5 from "sap/ui/test/Opa5";{{action-import}}

const viewName = "{{view-name}}";

export default class {{page-name}}Page extends Opa5 {
\t{{actions-ref}}
\t{{assert-ref}}
}`;
export const TSImportTemplate = `import {{action-class}} from "sap/ui/test/actions/{{action-class}}";`;
export const ActionsTemplate = `\t\t\tactions: new {{action-type}}(),`;
