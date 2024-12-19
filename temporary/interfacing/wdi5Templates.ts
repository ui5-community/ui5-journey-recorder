//#region Journey dependent templates
//-- JS
export const JSTemplate = `{{page-import}}descripe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 

    it("{{test-intention}}", async () => {{{step-insert}}
    });
});
`;

export const JSImportTemplate = `const {{page-name}} = require("./pages/{{page-name}}Page");`;
//-- TS
export const TSTemplate = `{{page-import}}
describe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 
    
    it("{{test-intention}}", async () => {{{step-insert}}
    });
});`;

export const TSImportTemplate = `import {{page-name}} from "./pages/{{page-name}}Page";`;
//#endregion

//#region Page dependent templates
//-- JS
export const JSPageTemplate = `const { wdi5 } = require("wdio-ui5-service");

class {{page-name}} {
    _viewName = "{{page-path}}";
    
    async open() {
        wdi5.goTo("{{page-hash}}");
    }{{actions-ref}}{{assert-ref}}
}
    
module.exports = new {{page-name}}();`;

export const JSActionMethodTemplate = `\tasync {{method-name}}() {
\t\tconst oControl = await browser.asControl({{step-selector}});
\t\tawait oControl.{{action-method}}({{action-parameter}});
\t}\n`;

export const JSAssertionMethodTemplate = `\tasync {{method-name}}() {
\t\tconst oControl = await browser.asControl({{step-selector}});
\t\t// basic existence test, add custom checks as necessary
\t\texpect(oControl).toBeTruthy();
\t}`

//-- TS
export const TSPageTemplate = `import { wdi5Selector } from "wdio-ui5-service";
import { wdi5 } from "wdio-ui5-service";{{additional-imports}}
class {{page-name}} {
    _viewName = "{{page-path}}";

    async open() {
        wdi5.goTo("{{page-hash}}");
    }{{actions-ref}}{{assert-ref}}
}

export default new {{page-name}}();`;

export const TSControlImport = `import {{control-class}} from "{{control-lib-path}}";`;

export const TSActionMethodTemplate = `\tasync {{method-name}}() {
\t\tconst oSelector: wdi5Selector = {{step-selector}};
\t\tconst oControl = await browser.asControl<{{control-class}}>(oSelector);
\t\tawait oControl.{{action-method}}({{action-parameter}});
\t}`;

export const TSAssertionMethodTemplate = `\tasync {{method-name}}() {
\t\tconst oSelector: wdi5Selector = {{step-selector}};
\t\tconst oControl = await browser.asControl<{{control-class}}>(oSelector);
\t\t// basic existence test, add custom checks as necessary
\t\texpect(oControl).toBeTruthy();
\t}`
//#endregion