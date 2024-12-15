//#region --- JS ---
export const JSTemplate = `
/* global QUnit */
sap.ui.define([
\t"sap/ui/test/opaQunit"{{page-import}}
], function (opaTest) {
\t"use strict";

\tQUnit.module("{{journey-name}}");

\topaTest("{{test-intention}}", function (Given, When, Then) {
\t\t// Arrangements
\t\tGiven.iStartMyUIComponent({
\t\t\tcomponentConfig: {
\t\t\t\tname: "{{app-prefix}}"
\t\t\t}
\t\t});

\t\t{{step-insert}}

\t\t// Cleanup
\t\tThen.iTeardownMyApp();
\t});
});`;

export const JSMethodTemplate = `
\t\t//{{step-comment}} 
\t\t{{step-type}}.onThe{{page-name}}.{{function-name}}();`;

export const JSImportTemplate = `\t"./pages/{{page-name}}Page"`;

// sry for the exceptional amount of tabulator signs, we need them for formatting
export const JSMethodImplementationTemplate = `
\t\t\t\t{{method-name}}: function () {
\t\t\t\t\treturn this.waitFor(Object.assign({ {{action-create}}
\t\t\t\t\t\tviewName: theViewName,
\t\t\t\t\t\tsuccess: function () {
\t\t\t\t\t\t\tOpa5.assert.ok(true, "{{message-success}}");
\t\t\t\t\t\t},
\t\t\t\t\t\terrorMessage: "{{error-message}}"
\t\t\t\t\t}, {{step-selector}}));
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

export const JSActionImportTemplate = `\t"sap/ui/test/actions/{{action-class}}"`;
//#endregion
//#region --- TS ---
export const TSTemplate = `
import opaTest from "sap/ui/test/opaQunit";{{page-import}}
{{page-user}}

QUnit.module("{{journey-name}}");

opaTest("{{test-intention}}", function () {
\t// Arrangements
\tonThe{{page-user-first}}Page.iStartMyUIComponent({
\t\tcomponentConfig: {
\t\t\tname: "{{app-prefix}}"
\t\t}
\t});
\t{{step-insert}}

\t// Cleanup
\tonThe{{page-user-first}}Page.iTeardownMyApp();
});`;

export const TSMethodTemplate = `
\t//{{step-comment}} 
\tonThe{{page-name}}Page.{{function-name}}();`;

export const TSImportTemplate = `import {{page-name}}Page from "./pages/{{page-name}}Page";`;

export const TSMethodImplementationTemplate = `
\t{{method-name}}() {
\t\tthis.waitFor(Object.assign({ {{action-create}}
\t\t\tviewName,
\t\t\tsuccess: () => {
\t\t\t\tOpa5.assert.ok(true, "{{message-success}}");
\t\t\t},
\t\t\terrorMessage: "{{message-error}}"
\t\t}, {{step-selector}}));
\t}`;

export const TSPageTemplate = `
import Opa5 from "sap/ui/test/Opa5";{{action-import}}

const viewName = "{{view-name}}";

export default class {{page-name}}Page extends Opa5 {
\t{{actions-ref}}
\t{{assert-ref}}
}`;

export const TSActionImportTemplate = `import {{action-class}} from "sap/ui/test/actions/{{action-class}}";`;

export const ActionsTemplate = `\t\t\tactions: new {{action-type}}(),`;
//#endregion