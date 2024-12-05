const JSTemplate = "" +
    `/* global QUnit */
sap.ui.define([
	"sap/ui/test/opaQunit"{{page-import}}
], function (opaTest) {
	"use strict";

	QUnit.module("{{journey-name}}");

	opaTest("{{test-intention}}", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "{{app-prefix}}"
			}
		});
		{{step-insert}}
		// Cleanup
		Then.iTeardownMyApp();
	});
});`;

const JSMethodTemplate = "\n" +
    `       //{{step-comment}} 
        {{step-type}}.onThe{{page-name}}.{{method-name}}({{selector-object}});
        {{step-insert}}`;

const TSTemplate = "" +
    `import opaTest from "sap/ui/test/opaQunit";{{page-import}}
{{page-user}}

QUnit.module("{{journey-name}}");

opaTest("{{test-intention}}", function () {
    // Arrangements
    {{page-user-first}}.iStartMyUIComponent({
		componentConfig: {
			name: "{{app-prefix}}"
		}
	});
	{{step-insert}}
    // Cleanup
	{{page-user-first}}.iTeardownMyApp();
});`;

const TSMethodTemplate = "\n" +
    `   //{{step-comment}} 
    onThe{{page-name}}Page.{{method-name}}({{selector-object}});
    {{step-insert}}`;

module.exports = class JourneyTemplate {

    private _testName: string;
    private _appPrefix: string;
    private _steps: {
        step_comment: string,
        step_type: string,
        step_selector: string,
        page_name: string,
        function_name: string,
        step: Record<string, unknown>
    }[];
    private _pages: Record<string, null> = {};

    constructor() { }

    extractAppPrefix(oJourneyJSON: Record<string, unknown>): JourneyTemplate {
        const aSteps = oJourneyJSON["steps"] as Record<string, unknown>[];
        if (aSteps.length > 0) {
            const sFirstPageName = (aSteps[0]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }

    extractJourneyName(oJourneyJSON: Record<string, unknown>): JourneyTemplate {
        this._testName = oJourneyJSON["name"] as string;
        return this;
    }

    extractSteps(oJourneyJSON: Record<string, unknown>): JourneyTemplate {
        const aSteps = oJourneyJSON["steps"] as Record<string, unknown>[];
        this._steps = aSteps.map((oStep: Record<string, unknown>) => {
            const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sComment = (bAssertion ? ' Assertion ' : ' Action ') + oStep.comment || '';
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;
            let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
            sStepSelector = sStepSelector.replaceAll(/\n/gm, '\n\t\t');
            this._pages[sPageName] = null;
            return {
                step_comment: sComment,
                step_type: sType,
                step_selector: sStepSelector,
                page_name: sPageName,
                function_name: sMethodName,
                step: oStep
            }
        });
        return this;
    }

    generate(bTypeScript: boolean = false): string {
        if (bTypeScript) {
            return this._generateTSJourney();
        } else {
            return this._generateJSJourney();
        }
    }

    private _generateJSJourney(): string {
        let resultingJourney = JSTemplate.replace("{{journey-name}}", this._testName)
            .replace("{{test-intention}}", this._testName)
            .replace("{{app-prefix}}", this._appPrefix);

        Object.keys(this._pages).forEach((sPage) => {
            resultingJourney = resultingJourney.replace("{{page-import}}", `,\n\t"./pages/${sPage}Page"{{page-import}}`)
        })

        this._steps.forEach((oStep) => {
            resultingJourney = resultingJourney.replace("{{step-insert}}",
                JSMethodTemplate.replace("{{step-comment}}", oStep.step_comment)
                    .replace("{{step-type}}", oStep.step_type)
                    .replace("{{page-name}}", oStep.page_name)
                    .replace("{{method-name}}", oStep.function_name)
                    .replace("{{selector-object}}", oStep.step_selector));
        });

        resultingJourney = resultingJourney.replace("{{page-import}}", "")
            .replace("{{step-insert}}", "");

        return resultingJourney;
    }

    private _generateTSJourney(): string {
        let resultingJourney = TSTemplate.replace("{{journey-name}}", this._testName)
            .replace("{{test-intention}}", this._testName)
            .replace("{{app-prefix}}", this._appPrefix);

        Object.keys(this._pages).forEach((sPage) => {
            resultingJourney = resultingJourney.replace("{{page-import}}", `\nimport ${sPage}Page from "./pages/${sPage}Page";{{page-import}}`);
            resultingJourney = resultingJourney.replace("{{page-user}}", `\nconst onThe${sPage}Page = new ${sPage}Page();{{page-user}}`);
        }, resultingJourney)

        if (Object.keys(this._pages)[0]) {
            resultingJourney = resultingJourney.replaceAll("{{page-user-first}}", `onThe${Object.keys(this._pages)[0]}Page`);
        }

        this._steps.forEach((oStep) => {
            resultingJourney = resultingJourney.replace("{{step-insert}}",
                TSMethodTemplate.replace("{{step-comment}}", oStep.step_comment)
                    .replace("{{page-name}}", oStep.page_name)
                    .replace("{{method-name}}", oStep.function_name)
                    .replace("{{selector-object}}", oStep.step_selector));
        });

        resultingJourney = resultingJourney
            .replace("{{page-import}}", "")
            .replace("{{page-user}}", "")
            .replace("{{step-insert}}", "");

        return resultingJourney;
    }

    private _genMethodNameForStep(oStepJSON: Record<string, unknown>): string {

        const sMethodName: string[] = [];
        const aClassSpecifier = ((oStepJSON.control as Record<string, unknown>).type as string).split('.');

        switch (oStepJSON.actionType) {
            case 'input':
                sMethodName.push('iType_');
                sMethodName.push((oStepJSON.keys as Record<string, unknown>[]).reduce((agg: string, o: Record<string, unknown>) => agg + o.key, ''));
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
}