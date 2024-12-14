import Generator from './Generator';
import PageGenerator from './PageGenerator';

export default abstract class JourneyGenerator extends Generator {
    _appPrefix: string;
    _testName = "";
    _steps: {
        "step-comment": string,
        "step-type": string,
        "page-name": string,
        "function-name": string,
        "step"?: Record<string, unknown>
    }[] = [];
    _pages: Record<string, PageGenerator> = {};

    setJourneyJSON(oJourneyJSON: Record<string, unknown>): JourneyGenerator {
        this._extractAppPrefix(oJourneyJSON);
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }

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

    generatePages(bTypeScript: boolean = false): { pageName: string, pageContent: string }[] {
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: (eP[1] as PageGenerator).generate(bTypeScript) }));
    }

    abstract _getPageGenerator(sPageName: string, sPageHash: string): PageGenerator;

    abstract _getJourneyTemplate(bTS: boolean): string;

    abstract _getMethodTemplate(bTS: boolean): string;

    abstract _getImportTemplate(bTS: boolean): string;

    abstract _getPageImports(bTS: boolean): string;

    private _extractAppPrefix(oJourneyJSON: Record<string, unknown>): JourneyGenerator {
        const aSteps = oJourneyJSON["steps"] as Record<string, unknown>[];
        if (aSteps.length > 0) {
            const sFirstPageName = (aSteps[0]["viewInfos"] as { absoluteViewName: string, relativeViewName: string });
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }

    private _extractJourneyName(oJourneyJSON: Record<string, unknown>): void {
        this._testName = oJourneyJSON["name"] as string;
    }

    private _extractSteps(oJourneyJSON: Record<string, unknown>): void {
        const aSteps = oJourneyJSON["steps"] as Record<string, unknown>[];
        this._steps = aSteps.map((oStep: Record<string, unknown>) => {
            const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sComment = (bAssertion ? ' Assertion' : ' Action') + (oStep.comment ? `: ${oStep.comment}` : '');
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;

            if (!this._pages[sPageName]) {
                const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
                this._pages[sPageName] = this._getPageGenerator(oViewInfos.absoluteViewName, oStep.actionLocation as string);
            }

            (this._pages[sPageName] as PageGenerator).addMethod((oStep as Record<string, unknown>));

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