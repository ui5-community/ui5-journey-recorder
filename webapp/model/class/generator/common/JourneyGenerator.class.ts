import Journey from "../../Journey.class";
import { Step } from "../../Step.class";
import Generator from "./Generator.class";
import { PageGenerator } from "./PageGenerator.class";

type GenerationStep = {
    "step-comment": string,
    "step-type": string,
    "page-name": string,
    "function-name": string,
    "step"?: Step
}

export default abstract class JourneyGenerator extends Generator {
    _appPrefix: string;
    _testName = "";
    _steps: GenerationStep[] = [];
    _pages: Record<string, PageGenerator> = {};
    _journey: Journey;

    constructor(oJourney: Journey) {
        super();
        this._journey = oJourney;
        this._appPrefix = this._journey.namespace;
        this._testName = this._journey.name;
        this._extractSteps();
    }

    abstract _getPageGenerator(sPageName: string, sPageHash: string): PageGenerator;
    abstract _getJourneyTemplate(bTS: boolean): string;
    abstract _getMethodTemplate(bTS: boolean): string;
    abstract _getImportTemplate(bTS: boolean): string;
    abstract _getPageImports(bTS: boolean): string;

    generate(bTS: boolean = false): string {
        const sJourneyTemplate = this._getJourneyTemplate(bTS);
        const sMethodTemplate = this._getMethodTemplate(bTS);

        const placeholders = {
            "journey-name": this._testName,
            "test-intention": this._testName,
            "app-prefix": this._appPrefix,
            "page-first-name": Object.keys(this._pages).length > 0 ? Object.keys(this._pages)[0] : '<empty>',
            "page-user": '\n' + Object.keys(this._pages).map(sP => this._replacePlaceholders(`const onThe{{page-name}}Page = new {{page-name}}Page();`.slice(), { "page-name": sP })).join("\n"),
            "page-user-first": Object.keys(this._pages).length > 0 ? Object.keys(this._pages)[0] : '<empty>',
            "page-import": this._getPageImports(bTS),
            "step-insert": this._steps.map(oStep => {
                const stepClone = { ...oStep };
                delete stepClone.step;
                return this._replacePlaceholders(sMethodTemplate.slice(), (stepClone as unknown as Record<string, string>));
            }).join('\n')
        }

        return this._replacePlaceholders(sJourneyTemplate, placeholders);
    }

    generatePages(bTS: boolean = false): { pageName: string, pageContent: string }[] {
        return Object.entries(this._pages)
            .map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTS) }));
    }

    private _extractSteps(): void {
        this._steps = this._journey.steps.map((oStep: Step) => {
            const oViewInfos = oStep.viewInfos;
            const sMethodName = this._genMethodNameForStep(oStep);
            const bAssertion = oStep.actionType === 'validate';
            const sComment = (bAssertion ? ' Assertion' : ' Action') + (oStep.comment ? `: ${oStep.comment}` : '');
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;

            if (!this._pages[sPageName]) {
                this._pages[sPageName] = this._getPageGenerator(oViewInfos.absoluteViewName, oStep.actionLocation);
            }

            this._pages[sPageName].addMethod(oStep);

            return {
                "step-comment": sComment,
                "step-type": sType,
                //"step-selector": sStepSelector,
                "page-name": sPageName,
                "function-name": sMethodName,
                "step": oStep
            }
        });
    }
}