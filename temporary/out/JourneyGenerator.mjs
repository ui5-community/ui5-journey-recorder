import AbstractGenerator from './AbstractGenerator.mjs';
import PageGenerator from './PageGenerator.mjs';
import { JSTemplate, JSMethodTemplate, TSTemplate, TSMethodTemplate, JSImportTemplate, TSImportTemplate, TSPageConstantTemplate } from './JourneyTemplates.mjs';
export default class JourneyGenerator extends AbstractGenerator {
    _testName;
    _appPrefix;
    _steps;
    _pages = {};
    setJourneyJSON(oJourneyJSON) {
        this._extractAppPrefix(oJourneyJSON);
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }
    _extractAppPrefix(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        if (aSteps.length > 0) {
            const sFirstPageName = aSteps[0]["viewInfos"];
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }
    _extractJourneyName(oJourneyJSON) {
        this._testName = oJourneyJSON["name"];
        return this;
    }
    _extractSteps(oJourneyJSON) {
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
                this._pages[sPageName] = new PageGenerator(oViewInfos.absoluteViewName);
            }
            this._pages[sPageName].addMethod(oStep);
            return {
                "step-comment": sComment,
                "step-type": sType,
                "step-selector": sStepSelector,
                "page-name": sPageName,
                "function-name": sMethodName,
                "step": oStep
            };
        });
        return this;
    }
    generate(bTS = false) {
        let sGeneratedText = bTS ? TSTemplate : JSTemplate;
        const sMethodTemplate = bTS ? TSMethodTemplate : JSMethodTemplate;
        const sImportTemplate = bTS ? TSImportTemplate : JSImportTemplate;
        const placeholders = {
            "journey-name": this._testName,
            "test-intention": this._testName,
            "app-prefix": this._appPrefix,
            "page-user": '\n' + Object.keys(this._pages).map(sP => this._replacePlaceholders(TSPageConstantTemplate.slice(), { "page-name": sP })).join("\n"),
            "page-user-first": Object.keys(this._pages).length > 0 ? Object.keys(this._pages)[0] : '<empty>',
            "page-import": (bTS ? "\n" : ",\n") + Object.keys(this._pages).map(sP => this._replacePlaceholders(sImportTemplate.slice(), { "page-name": sP })).join(bTS ? "\n" : ",\n"),
            "step-insert": '\n' + this._steps.map(oStep => {
                const stepClone = { ...oStep };
                delete stepClone.step;
                return this._replacePlaceholders(sMethodTemplate.slice(), stepClone);
            }).join('\n\n') + '\n'
        };
        sGeneratedText = this._replacePlaceholders(sGeneratedText, placeholders);
        return sGeneratedText;
        /* if (bTS) {
            return this._generateTSJourney();
        } else {
            return this._generateJSJourney();
        } */
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
            resultingJourney = resultingJourney.replace("{{step-insert}}", JSMethodTemplate.replace("{{step-comment}}", oStep["step-comment"])
                .replace("{{step-type}}", oStep["step-type"])
                .replace("{{page-name}}", oStep["page-name"])
                .replace("{{method-name}}", oStep["function-name"])
                .replace("{{selector-object}}", oStep["step-selector"]));
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
            resultingJourney = resultingJourney.replace("{{step-insert}}", TSMethodTemplate.replace("{{step-comment}}", oStep["step-comment"])
                .replace("{{page-name}}", oStep["page-name"])
                .replace("{{method-name}}", oStep["function-name"])
                .replace("{{selector-object}}", oStep["step-selector"]));
        });
        resultingJourney = resultingJourney
            .replace("{{page-import}}", "")
            .replace("{{page-user}}", "")
            .replace("{{step-insert}}", "");
        return resultingJourney;
    }
}
