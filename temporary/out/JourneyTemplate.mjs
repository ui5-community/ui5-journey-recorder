import RootTemplate from './RootTemplate.mjs';
import PageTemplate from './PageTemplate.mjs';
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
export default class JourneyTemplate extends RootTemplate {
    _testName;
    _appPrefix;
    _steps;
    _pages = {};
    constructor() {
        super();
    }
    extractAppPrefix(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        if (aSteps.length > 0) {
            const sFirstPageName = aSteps[0]["viewInfos"];
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }
    extractJourneyName(oJourneyJSON) {
        this._testName = oJourneyJSON["name"];
        return this;
    }
    extractSteps(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        this._steps = aSteps.map((oStep) => {
            const oViewInfos = oStep["viewInfos"];
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sComment = (bAssertion ? ' Assertion ' : ' Action ') + oStep.comment || '';
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;
            let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
            sStepSelector = sStepSelector.replaceAll(/\n/gm, '\n\t\t');
            if (!this._pages[sPageName]) {
                const oViewInfos = oStep["viewInfos"];
                this._pages[sPageName] = new PageTemplate(oViewInfos.absoluteViewName);
            }
            this._pages[sPageName].addMethod(oStep);
            return {
                step_comment: sComment,
                step_type: sType,
                step_selector: sStepSelector,
                page_name: sPageName,
                function_name: sMethodName,
                step: oStep
            };
        });
        return this;
    }
    generate(bTypeScript = false) {
        if (bTypeScript) {
            return this._generateTSJourney();
        }
        else {
            return this._generateJSJourney();
        }
    }
    generatePages(bTypeScript = false) {
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTypeScript) }));
    }
    _generateJSJourney() {
        let resultingJourney = JSTemplate.replace("{{journey-name}}", this._testName)
            .replace("{{test-intention}}", this._testName)
            .replace("{{app-prefix}}", this._appPrefix);
        Object.keys(this._pages).forEach((sPage) => {
            resultingJourney = resultingJourney.replace("{{page-import}}", `,\n\t"./pages/${sPage}Page"{{page-import}}`);
        });
        this._steps.forEach((oStep) => {
            resultingJourney = resultingJourney.replace("{{step-insert}}", JSMethodTemplate.replace("{{step-comment}}", oStep.step_comment)
                .replace("{{step-type}}", oStep.step_type)
                .replace("{{page-name}}", oStep.page_name)
                .replace("{{method-name}}", oStep.function_name)
                .replace("{{selector-object}}", oStep.step_selector));
        });
        resultingJourney = resultingJourney.replace("{{page-import}}", "")
            .replace("{{step-insert}}", "");
        return resultingJourney;
    }
    _generateTSJourney() {
        let resultingJourney = TSTemplate.replace("{{journey-name}}", this._testName)
            .replace("{{test-intention}}", this._testName)
            .replace("{{app-prefix}}", this._appPrefix);
        Object.keys(this._pages).forEach((sPage) => {
            resultingJourney = resultingJourney.replace("{{page-import}}", `\nimport ${sPage}Page from "./pages/${sPage}Page";{{page-import}}`);
            resultingJourney = resultingJourney.replace("{{page-user}}", `\nconst onThe${sPage}Page = new ${sPage}Page();{{page-user}}`);
        }, resultingJourney);
        if (Object.keys(this._pages)[0]) {
            resultingJourney = resultingJourney.replaceAll("{{page-user-first}}", `onThe${Object.keys(this._pages)[0]}Page`);
        }
        this._steps.forEach((oStep) => {
            resultingJourney = resultingJourney.replace("{{step-insert}}", TSMethodTemplate.replace("{{step-comment}}", oStep.step_comment)
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
}
