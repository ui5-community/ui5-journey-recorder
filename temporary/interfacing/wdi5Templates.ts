export const JSTemplate = `
{{page-import}}descripe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 

    it("{{test-intention}}", async () => {{{step-insert}}
    });
});
`;

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
        await super.open('{{page-hash}}');
    }{{actions-ref}}{{assert-ref}}
}
    
module.exports = new {{page-name}}();`;

export const JSImportTemplate = `const {{page-name}} = require("./pages/{{page-name}}");`;

export const TSTemplate = `
{{page-import}}
describe("{{journey-name}}", () => {
    before(async () => {
        await {{page-first-name}}.open();
    }); 
    
    it("{{test-intention}}", async () => {{{step-insert}}
    });
});`;

export const TSGeneralPageTemplate = `
import { wdi5 } from "wdio-ui5-service"

export default class Page {
    async open(path) {
        wdi5.goTo(path)
    }
}`;

export const TSPageTemplate = `
import { wdi5Selector } from "wdio-ui5-service";
import Page from "./Page";

class {{page-name}} extends Page {
    _viewName = "{{page-path}}";

    async open() {
        await super.open('{{page-hash}}');
    }{{actions-ref}}{{assert-ref}}
}

export default new {{page-name}}();`;

export const TSImportTemplate = `import {{page-name}} from "./pages/{{page-name}}";`;