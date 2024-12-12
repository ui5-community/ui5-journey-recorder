//#region Journey dependent templates
//-- JS
export const JSTemplate = `
{{page-import}}descripe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 

    it("{{test-intention}}", async () => {{{step-insert}}
    });
});
`;
export const JSImportTemplate = `const {{page-name}} = require("./pages/{{page-name}}");`;
//-- TS
export const TSTemplate = `
{{page-import}}
describe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 
    
    it("{{test-intention}}", async () => {{{step-insert}}
    });
});`;
export const TSImportTemplate = `import {{page-name}} from "./pages/{{page-name}}";`;
//#endregion
//#region Page dependent templates
//-- JS
export const JSGeneralPageTemplate = `
const { wdi5 } = require("wdio-ui5-service");

module.exports = class Page {
    async open(path) {
        wdi5.goTo(path);
    }
}`;
export const JSPageTemplate = `
const Page = require("./Page");

class {{page-name}} extends Page {
    _viewName = "{{page-path}}";
    
    async open() {
        await super.open("{{page-hash}}");
    }{{actions-ref}}{{assert-ref}}
}
    
module.exports = new {{page-name}}();`;
export const JSActionMethodTemplate = `\tasync {{method-name}}() {
\t\t const oControl = await browser.asControl({{step-selector}});
\t\t await oControl.{{action-method}}({{action-parameter}});
\t}`;
export const JSAssertionMethodTemplate = `\tasync {{method-name}}() {
\t\t const oControl = await browser.asControl({{step-selector}});
\t\t // basic existence test, add custom checks as necessary
\t\t expect(oControl).toBeTruthy();
\t}`;
//-- TS
export const TSGeneralPageTemplate = `import { wdi5 } from "wdio-ui5-service"

export default class Page {
    async open(path) {
        wdi5.goTo(path)
    }
}`;
export const TSPageTemplate = `import { wdi5Selector } from "wdio-ui5-service";
import Page from "./Page";{{control-imports}}

class {{page-name}} extends Page {
    _viewName = "{{page-path}}";

    async open() {
        await super.open("{{page-hash}}");
    }{{actions-ref}}{{assert-ref}}
}

export default new {{page-name}}();`;
export const TSControlImport = `import {{control-class}} from "{{control-lib-path}}";`;
export const TSActionMethodTemplate = `\tasync {{method-name}}() {
\t\t const oSelector: wdi5Selector = {{step-selector}};
\t\t const oControl = await browser.asControl<{{control-class}}>(oSelector);
\t\t await oControl.{{action-method}}({{action-parameter}});
\t}`;
export const TSAssertionMethodTemplate = `\tasync {{method-name}}() {
\t\t const oSelector: wdi5Selector = {{step-selector}};
\t\t const oControl = await browser.asControl<{{control-class}}>(oSelector);
\t\t // basic existence test, add custom checks as necessary
\t\t expect(oControl).toBeTruthy();
\t}`;
//#endregion
