export const JourneyTemplates = {
    Journey: `{{page-import}}descripe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 

    it("{{test-intention}}", async () => {{{step-insert}}
    });
});`,
    JourneyMethod: `\n\t\t//{{step-comment}}\n\t\t{{page-name}}.{{function-name}}();`,
    JS: {
        PageImport: `const {{page-name}} = require("./pages/{{page-name}}Page");`
    },
    TS: {
        PageImport: `import {{page-name}} from "./pages/{{page-name}}Page";`
    }
};

export const PageTemplates = {
    JS: {
        Page: `const { wdi5 } = require("wdio-ui5-service");

class {{page-name}} {
    _viewName = "{{page-path}}";
    
    async open() {
        wdi5.goTo("{{page-hash}}");
    }{{actions-ref}}{{assert-ref}}
}
    
module.exports = new {{page-name}}();`,
        ActionMethod: `\tasync {{method-name}}() {
\t\tconst oControl = await browser.asControl({{step-selector}});
\t\tawait oControl.{{action-method}}({{action-parameter}});
\t}\n`,
        ValidationMethod: `\tasync {{method-name}}() {
\t\tconst oControl = await browser.asControl({{step-selector}});
\t\t// basic existence test, add custom checks as necessary
\t\texpect(oControl).toBeTruthy();
\t}`
    },
    TS: {
        Page: `import { wdi5Selector } from "wdio-ui5-service";
import { wdi5 } from "wdio-ui5-service";{{additional-imports}}
class {{page-name}} {
    _viewName = "{{page-path}}";

    async open() {
        wdi5.goTo("{{page-hash}}");
    }{{actions-ref}}{{assert-ref}}
}

export default new {{page-name}}();`,
        ActionMethod: `\tasync {{method-name}}() {
\t\tconst oSelector: wdi5Selector = {{step-selector}};
\t\tconst oControl = await browser.asControl<{{control-class}}>(oSelector);
\t\tawait oControl.{{action-method}}({{action-parameter}});
\t}`,
        ValidationMethod: `\tasync {{method-name}}() {
\t\tconst oSelector: wdi5Selector = {{step-selector}};
\t\tconst oControl = await browser.asControl<{{control-class}}>(oSelector);
\t\t// basic existence test, add custom checks as necessary
\t\texpect(oControl).toBeTruthy();
\t}`,
        ControlImport: `import {{control-class}} from "{{control-lib-path}}";`
    }
}