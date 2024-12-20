export const JourneyTemplates = {
        JS: {
                Journey: `/* global QUnit */
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
});`,
                JourneyMethod: `
\t\t//{{step-comment}} 
\t\t{{step-type}}.onThe{{page-name}}.{{function-name}}();`,
                PageImport: `\t"./pages/{{page-name}}Page"`
        },
        TS: {
                Journey: `import opaTest from "sap/ui/test/opaQunit";{{page-import}}
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
});`,
                JourneyMethod: `
\t//{{step-comment}} 
\tonThe{{page-name}}Page.{{function-name}}();`,
                PageImport: `import {{page-name}}Page from "./pages/{{page-name}}Page";`
        }
};

export const PageTemplates = {
        JS: {
                Page: `sap.ui.define([
\t"sap/ui/test/Opa5"{{additional-imports}}
], function (Opa5{{additional-class}}) {
\t"use strict";

\tconst theViewName = "{{page-path}}";

\tOpa5.createPageObjects({
\t\tonThe{{page-name}}Page: { {{actions-ref}}{{assert-ref}}
\t\t}
\t});
});`,
                MethodImplementation: `
\t{{method-name}}: function () {
\t\treturn this.waitFor(Object.assign({ {{action-method}}
\t\t\tviewName: theViewName,
\t\t\tsuccess: function () {
\t\t\t\tOpa5.assert.ok(true, "{{success-message}}");
\t\t\t},
\t\t\terrorMessage: "{{error-message}}"
\t\t}, {{step-selector}}));
\t},`,
                ActionImport: `\t"sap/ui/test/actions/{{control-class}}"`
        },
        TS: {
                Page: `import Opa5 from "sap/ui/test/Opa5";{{additional-imports}}

const viewName = "{{page-path}}";

export default class {{page-name}}Page extends Opa5 {
\t{{actions-ref}}
\t{{assert-ref}}
}`,
                MethodImplementation: `
\t{{method-name}}() {
\t\tthis.waitFor(Object.assign({ {{action-method}}
\t\t\tviewName,
\t\t\tsuccess: () => {
\t\t\t\tOpa5.assert.ok(true, "{{success-message}}");
\t\t\t},
\t\t\terrorMessage: "{{error-message}}"
\t\t}, {{step-selector}}));
\t}`,
                ActionImport: `import {{control-class}} from "{{control-lib-path}}";`
        },
        NewAction: `\t\t\tactions: new {{action-method}}({{action-parameter}}),`
};