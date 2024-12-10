import JourneyGenerator from './JourneyGenerator.mjs';
import * as fs from 'fs';
const sJsonContent = fs.readFileSync('./out/Demo.json', { encoding: 'utf-8' });
const oJsonContent = JSON.parse(sJsonContent);
class OPA5Journey {
    _oJson;
    _oJourney;
    constructor(oJson) {
        this._oJson = oJson;
    }
    //#region templateClass
    createByTemplateClass(bTS = false) {
        this._oJourney = new JourneyGenerator().setJourneyJSON(this._oJson);
        return this._oJourney.generate(bTS);
    }
    createByTemplatePages(bTS = false) {
        return this._oJourney ? this._oJourney.generatePages(bTS) : [];
    }
    //#endregion
    //#region JS
    createJSJourney() {
        const sName = this._oJson["name"];
        const sJourney = [
            `/* global QUnit */`,
            `sap.ui.define([`,
            `  "sap/ui/test/opaQunit",`,
            this._genPagesImport(),
            `], function(opaTest) {`,
            `  "use strict";`,
            ``,
            `  QUnit.module("${sName}");`,
            ``,
            `  opaTest("Test ${sName}", function(Given, When, Then) {`,
            this._genJSStartUp(),
            `   `,
            this._genJSSteps(),
            `   `,
            this._genJSTeardown(),
            `  });`,
            `});`,
        ].join("\n");
        return [
            { title: 'Journey' /* replace with oName later on */, content: sJourney },
            ...this._genPages()
        ];
    }
    _genPages() {
        const pages = [];
        const pageMap = {};
        const aSteps = this._oJson["steps"];
        aSteps.forEach(oStep => {
            const oViewInfos = oStep["viewInfos"];
            const sPageName = oViewInfos.relativeViewName;
            const sMethodName = this._genMethodNameForStep(oStep);
            const sFunctionBody = [`function (oSelector) {`,
                `return this.waitFor({ ...oSelector });`,
                `}`].join('\n');
            if (!pageMap[sPageName]) {
                pageMap[sPageName] = { actions: {}, assertions: {} };
            }
            const sCategory = oStep["actionType"] === 'validate' ? 'assertions' : 'actions';
            pageMap[sPageName][sCategory][sMethodName] = sFunctionBody;
        });
        Object.keys(pageMap).forEach((pageName) => {
            pages.push({ title: pageName, content: this._genPage(pageName, pageMap[pageName]) });
        });
        return pages;
    }
    _genPage(sPageName, oPageContent) {
        return [`sap.ui.define([`, `\t"sap/ui/test/Opa5"`,
            `], function(Opa5){`, `\t"use strict";`,
            ``, `\tOpa5.createPageObject({`,
            `\t\tonThe${sPageName}Page: ${JSON.stringify(oPageContent, null, 2)
                .replaceAll(/\n/gm, '\n\t\t')
                .replaceAll(/\s{2}\"/gm, '\t')
                .replaceAll(/\"\:\s{1}\{/gm, ': {')
                .replaceAll(/\"\:\s{1}\"/gm, ': ')
                .replaceAll(/\;\\n\}\"/gm, '; }')
                .replaceAll(/\\nreturn/gm, ' return')}`,
            `\t});`, `});`].join('\n');
    }
    _genPagesImport() {
        const aSteps = this._oJson["steps"];
        return aSteps.map((s) => {
            const oViewInfos = s["viewInfos"];
            return `  "./pages/${oViewInfos.relativeViewName}"`;
        }).filter((value, index, array) => {
            return array.indexOf(value) === index;
        }).join(",\n");
    }
    _genJSStartUp() {
        const aSteps = this._oJson["steps"];
        const sFirstPageName = aSteps[0]["viewInfos"];
        return [
            `// Arrangements`,
            `Given.iStartMyUIComponent({`,
            `   componentConfig: {`,
            `       name: "${sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '')}"`,
            `   }`,
            `})`
        ].map(sString => `      ${sString}`).join("\n");
    }
    _genJSTeardown() {
        const aSteps = this._oJson["steps"];
        const sLastPageName = aSteps[aSteps.length - 1]["viewInfos"];
        return [
            `// Cleanup`,
            `Then.iTeardownMyApp();`
        ].map(sString => `      ${sString}`).join("\n");
    }
    _genJSSteps() {
        const aSteps = this._oJson["steps"];
        return aSteps.map(oStep => {
            const oViewInfos = oStep["viewInfos"];
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
            return [
                `// ${bAssertion ? 'Assertion' : 'Action'}: ${(oStep.comment || '')}`,
                `${bAssertion ? 'Then' : 'When'}.onThe${oViewInfos.relativeViewName}Page.${sMethodName}(${sSelector.replaceAll(/\n/gm, '\n\t\t')});`
            ].map(sString => `    ${sString}`).join("\n") + "\n";
        }).join("\n");
    }
    _genMethodNameForStep(oStep) {
        const sMethodName = [];
        const aClassSpecifier = oStep.control.type.split('.');
        switch (oStep.actionType) {
            case 'input':
                sMethodName.push('iType_');
                sMethodName.push(oStep.keys.reduce((agg, o) => agg + o.key, ''));
                sMethodName.push('_IntoThe');
                sMethodName.push(this._capitalizeFirstLetter(aClassSpecifier[aClassSpecifier.length - 1]));
                break;
            case 'clicked':
                sMethodName.push('iPress');
                sMethodName.push('The');
                sMethodName.push(this._capitalizeFirstLetter(aClassSpecifier[aClassSpecifier.length - 1]));
                break;
            case 'validate':
                sMethodName.push('iShouldSeeThe');
                sMethodName.push(this._capitalizeFirstLetter(aClassSpecifier[aClassSpecifier.length - 1]));
                break;
            default:
                sMethodName.push('xxx');
        }
        return sMethodName.join('');
    }
    _capitalizeFirstLetter(sString) {
        const oNumberMap = {
            '0': 'First',
            '1': 'Second',
            '2': 'Third',
        };
        if (isNaN(Number(sString))) {
            return String(sString).charAt(0).toUpperCase() + String(sString).slice(1);
        }
        else {
            let sNumberWord = oNumberMap[sString];
            sNumberWord = sNumberWord ? sNumberWord : (Number(sString) + 1) + 'th';
            return sNumberWord;
        }
    }
    //#endregion
    //#region TS
    createTSJourney() {
        const oName = this._oJson["name"];
        const sJourney = [
            `import opaTest from "sap/ui/test/opaQunit";`,
            ...this._genPagesImportTS(),
            ``,
            ...this._getPageLinks(),
            ``,
            `QUnit.module("${oName}");`,
            ``,
            `opaTest("Test ${oName}", function() {`,
            ``,
            this._genTSStartUp(),
            ``,
            this._genTSSteps(),
            ``,
            this._genTSTeardown(),
            `});`,
        ].join("\n");
        return sJourney;
    }
    _genPagesImportTS() {
        const aSteps = this._oJson["steps"];
        return aSteps.map((s) => {
            const oViewInfos = s["viewInfos"];
            return `import ${oViewInfos.relativeViewName}Page from "./pages/${oViewInfos.relativeViewName}Page";`;
        }).filter((value, index, array) => {
            return array.indexOf(value) === index;
        });
    }
    _getPageLinks() {
        const aSteps = this._oJson["steps"];
        return aSteps.map((s) => {
            const oViewInfos = s["viewInfos"];
            return `const onThe${oViewInfos.relativeViewName}Page = new ${oViewInfos.relativeViewName}Page();`;
        }).filter((value, index, array) => {
            return array.indexOf(value) === index;
        });
    }
    _genTSStartUp() {
        const aSteps = this._oJson["steps"];
        const sFirstPageName = aSteps[0]["viewInfos"];
        return [
            `// Arrangements`,
            `onThe${sFirstPageName.relativeViewName}Page.iStartMyUIComponent({`,
            `   componentConfig: {`,
            `       name: "${sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '')}"`,
            `   }`,
            `});`
        ].map(sString => `  ${sString}`).join("\n");
    }
    _genTSTeardown() {
        const aSteps = this._oJson["steps"];
        const sLastPageName = aSteps[aSteps.length - 1]["viewInfos"];
        return [
            `// Cleanup`,
            `onThe${sLastPageName.relativeViewName}Page.iTeardownMyApp();`
        ].map(sString => `  ${sString}`).join("\n");
    }
    _genTSSteps() {
        const aSteps = this._oJson["steps"];
        return aSteps.map(oStep => {
            const oViewInfos = oStep["viewInfos"];
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStepTS(oStep);
            return [
                `// ${bAssertion ? 'Assertion' : 'Action'}: ${(oStep.comment || '')}`,
                `onThe${oViewInfos.relativeViewName}Page.xxx();`
            ].map(sString => `    ${sString}`).join("\n") + "\n";
        }).join("\n");
    }
    _genMethodNameForStepTS(oStep) {
        return 'xxx';
    }
}
const oJourney = new OPA5Journey(oJsonContent);
fs.writeFileSync("./target/JS/Journey.js", oJourney.createByTemplateClass());
oJourney.createByTemplatePages().forEach((oP) => {
    fs.writeFileSync(`./target/JS/pages/${oP.pageName}Page.js`, oP.pageContent);
});
fs.writeFileSync("./target/TS/Journey.ts", oJourney.createByTemplateClass(true));
oJourney.createByTemplatePages(true).forEach((oP) => {
    fs.writeFileSync(`./target/TS/pages/${oP.pageName}Page.ts`, oP.pageContent);
});
const oDateTime = new Date();
console.log(`${('' + oDateTime.getUTCDate()).padStart(2, '0')}-${('' + (oDateTime.getUTCMonth() + 1)).padStart(2, '0')}-${oDateTime.getUTCFullYear()} ${('' + oDateTime.getUTCHours()).padStart(2, '0')}:${('' + oDateTime.getUTCMinutes()).padStart(2, '0')}:${('' + oDateTime.getUTCSeconds()).padStart(2, '0')} - Finished`);
