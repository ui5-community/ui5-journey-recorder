import AbstractGenerator from './AbstractGenerator';
import PageGenerator from './PageGenerator';
import { JSTemplate, JSMethodTemplate, TSTemplate, TSMethodTemplate, JSImportTemplate, TSImportTemplate, TSPageConstantTemplate } from './JourneyTemplates';

export default class JourneyGenerator extends AbstractGenerator {

    private _testName: string;
    private _appPrefix: string;
    private _steps: {
        "step-comment": string,
        "step-type": string,
        "step-selector": string,
        "page-name": string,
        "function-name": string,
        "step"?: Record<string, unknown>
    }[];
    private _pages: Record<string, PageGenerator> = {};

    setJourneyJSON(oJourneyJSON: Record<string, unknown>): JourneyGenerator {
        this._extractAppPrefix(oJourneyJSON);
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }

    private _extractAppPrefix(oJourneyJSON: Record<string, unknown>): JourneyGenerator {
        const aSteps = oJourneyJSON["steps"] as Record<string, unknown>[];
        if (aSteps.length > 0) {
            const sFirstPageName = (aSteps[0]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }

    private _extractJourneyName(oJourneyJSON: Record<string, unknown>): JourneyGenerator {
        this._testName = oJourneyJSON["name"] as string;
        return this;
    }

    private _extractSteps(oJourneyJSON: Record<string, unknown>): JourneyGenerator {
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

            if (!this._pages[sPageName]) {
                const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
                this._pages[sPageName] = new PageGenerator(oViewInfos.absoluteViewName);
            }

            this._pages[sPageName].addMethod((oStep as Record<string, unknown>));

            return {
                "step-comment": sComment,
                "step-type": sType,
                "step-selector": sStepSelector,
                "page-name": sPageName,
                "function-name": sMethodName,
                "step": oStep
            }
        });
        return this;
    }

    generate(bTS: boolean = false): string {
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
                return this._replacePlaceholders(sMethodTemplate.slice(), (stepClone as unknown as Record<string, string>));
            }).join('\n\n') + '\n'
        }

        sGeneratedText = this._replacePlaceholders(sGeneratedText, placeholders);
        return sGeneratedText;
    }

    generatePages(bTypeScript: boolean = false): { pageName: string, pageContent: string }[] {
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTypeScript) }));
    }
}