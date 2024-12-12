import AbstractGenerator from './AbstractGenerator';
import PageGenerator from './PageGenerator';
import { JSTemplate, JSMethodTemplate, TSTemplate, TSMethodTemplate, JSImportTemplate, TSImportTemplate, TSPageConstantTemplate } from './JourneyTemplates';

export default class JourneyGenerator extends AbstractGenerator {
    private _appPrefix: string;

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

    generate(bTS: boolean = false): string {
        const sJourneyTemplate = bTS ? TSTemplate : JSTemplate;
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

        return this._replacePlaceholders(sJourneyTemplate, placeholders);
    }

    generatePages(bTypeScript: boolean = false): { pageName: string, pageContent: string }[] {
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: (eP[1] as PageGenerator).generate(bTypeScript) }));
    }

    _getPageGenerator(sPageName: string, sPageHash: string): PageGenerator {
        return new PageGenerator(sPageName, sPageHash);
    }
}