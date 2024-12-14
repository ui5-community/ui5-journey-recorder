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
