import JourneyTemplate from './JourneyTemplate';

import * as fs from 'fs';

const sJsonContent = fs.readFileSync('./out/Demo.json', { encoding: 'utf-8' });
const oJsonContent = JSON.parse(sJsonContent);

class OPA5Journey {
    private _oJson: Record<string, unknown>;
    private _oJourney: JourneyTemplate;
    constructor(oJson: Record<string, unknown>) {
        this._oJson = oJson;
    }

    //#region templateClass
    public createByTemplateClass(bTS: boolean = false): string {
        this._oJourney = new JourneyTemplate()
            .extractAppPrefix(this._oJson)
            .extractJourneyName(this._oJson)
            .extractSteps(this._oJson);
        return this._oJourney.generate(bTS);
    }

    public createByTemplatePages(bTS: boolean = false): { pageName: string, pageContent: string }[] {
        return this._oJourney ? this._oJourney.generatePages(bTS) : [];
    }
    //#endregion

    //#region JS
    public createJSJourney(): { title: string, content: string }[] {
        const sName = this._oJson["name"] as string;
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

    private _genPages(): { title: string, content: string }[] {
        const pages: { title: string, content: string }[] = [];
        const pageMap: Record<string, { actions: Record<string, string>, assertions: Record<string, string> }> = {};

        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        aSteps.forEach(oStep => {
            const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
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

    private _genPage(sPageName: string, oPageContent: Record<string, unknown>): string {
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

    private _genPagesImport(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        return aSteps.map((s: Record<string, unknown>) => {
            const oViewInfos = s["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            return `  "./pages/${oViewInfos.relativeViewName}"`;
        }).filter((value, index, array) => {
            return array.indexOf(value) === index;
        }).join(",\n");
    }

    private _genJSStartUp(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        const sFirstPageName = (aSteps[0]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
        return [
            `// Arrangements`,
            `Given.iStartMyUIComponent({`,
            `   componentConfig: {`,
            `       name: "${sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '')}"`,
            `   }`,
            `})`
        ].map(sString => `      ${sString}`).join("\n");
    }

    private _genJSTeardown(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        const sLastPageName = (aSteps[aSteps.length - 1]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
        return [
            `// Cleanup`,
            `Then.iTeardownMyApp();`
        ].map(sString => `      ${sString}`).join("\n");
    }

    private _genJSSteps(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        return aSteps.map(oStep => {
            const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
            return [
                `// ${bAssertion ? 'Assertion' : 'Action'}: ${(oStep.comment || '')}`,
                `${bAssertion ? 'Then' : 'When'}.onThe${oViewInfos.relativeViewName}Page.${sMethodName}(${sSelector.replaceAll(/\n/gm, '\n\t\t')});`
            ].map(sString => `    ${sString}`).join("\n") + "\n";
        }).join("\n");
    }

    private _genMethodNameForStep(oStep: Record<string, unknown>): string {
        const sMethodName: string[] = [];
        const aClassSpecifier = ((oStep.control as Record<string, unknown>).type as string).split('.');

        switch (oStep.actionType) {
            case 'input':
                sMethodName.push('iType_');
                sMethodName.push((oStep.keys as Record<string, unknown>[]).reduce((agg: string, o: Record<string, unknown>) => agg + o.key, ''));
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

    private _capitalizeFirstLetter(sString: string): string {
        const oNumberMap: Record<string, string> = {
            '0': 'First',
            '1': 'Second',
            '2': 'Third',
        };
        if (isNaN(Number(sString))) {
            return String(sString).charAt(0).toUpperCase() + String(sString).slice(1);
        } else {
            let sNumberWord = oNumberMap[sString];
            sNumberWord = sNumberWord ? sNumberWord : (Number(sString) + 1) + 'th';
            return sNumberWord;
        }
    }
    //#endregion

    //#region TS
    public createTSJourney(): string {
        const oName: string = this._oJson["name"] as string;
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

    private _genPagesImportTS(): string[] {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        return aSteps.map((s: Record<string, unknown>) => {
            const oViewInfos = s["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            return `import ${oViewInfos.relativeViewName}Page from "./pages/${oViewInfos.relativeViewName}Page";`;
        }).filter((value, index, array) => {
            return array.indexOf(value) === index;
        });
    }
    private _getPageLinks(): string[] {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        return aSteps.map((s: Record<string, unknown>) => {
            const oViewInfos = s["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            return `const onThe${oViewInfos.relativeViewName}Page = new ${oViewInfos.relativeViewName}Page();`;
        }).filter((value, index, array) => {
            return array.indexOf(value) === index;
        });
    }

    private _genTSStartUp(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        const sFirstPageName = (aSteps[0]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
        return [
            `// Arrangements`,
            `onThe${sFirstPageName.relativeViewName}Page.iStartMyUIComponent({`,
            `   componentConfig: {`,
            `       name: "${sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '')}"`,
            `   }`,
            `});`
        ].map(sString => `  ${sString}`).join("\n");
    }

    private _genTSTeardown(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        const sLastPageName = (aSteps[aSteps.length - 1]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
        return [
            `// Cleanup`,
            `onThe${sLastPageName.relativeViewName}Page.iTeardownMyApp();`
        ].map(sString => `  ${sString}`).join("\n");
    }

    private _genTSSteps(): string {
        const aSteps = this._oJson["steps"] as Record<string, unknown>[];
        return aSteps.map(oStep => {
            const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStepTS(oStep);
            return [
                `// ${bAssertion ? 'Assertion' : 'Action'}: ${(oStep.comment || '')}`,
                `onThe${oViewInfos.relativeViewName}Page.xxx();`
            ].map(sString => `    ${sString}`).join("\n") + "\n";
        }).join("\n");
    }

    private _genMethodNameForStepTS(oStep: Record<string, unknown>): string {
        return 'xxx';
    }
    //#endregion
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
