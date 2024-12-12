import AbstractGenerator from './AbstractGenerator';
import wdi5PageGenerator from './wdi5PageGenerator';
import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate, TSGeneralPageTemplate } from './wdi5Templates';

export default class wdi5Generator extends AbstractGenerator {
    setJourneyJSON(oJourneyJSON: Record<string, unknown>): wdi5Generator {
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }

    generate(bTS: boolean = false): string {
        let sGeneratedText = bTS ? TSTemplate : JSTemplate;
        const sImportTemplate = bTS ? TSImportTemplate : JSImportTemplate;

        const placeholders = {
            "journey-name": this._testName,
            "test-intention": this._testName,
            "page-first-name": Object.keys(this._pages).length > 0 ? Object.keys(this._pages)[0] : '<empty>',
            "page-import": Object.keys(this._pages).map(sP => this._replacePlaceholders(sImportTemplate.slice(), { "page-name": sP })).join("\n"),
            "step-insert": this._steps.map(oStep => {
                const stepClone = { ...oStep };
                delete stepClone.step;
                return this._replacePlaceholders("\n\t\t//{{step-comment}}\n\t\t{{page-name}}.{{function-name}}();", (stepClone as unknown as Record<string, string>));
            }).join("\n")
        }

        return this._replacePlaceholders(sGeneratedText, placeholders);
    }

    generatePages(bTS: boolean = false): { pageName: string, pageContent: string }[] {
        const pages = Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTS) }));
        if (pages.length > 0) { pages.push({ pageName: '', pageContent: TSGeneralPageTemplate }) }
        return pages;
    }

    _getPageGenerator(sPageName: string, sPageHash: string): wdi5PageGenerator {
        return new wdi5PageGenerator(sPageName, sPageHash);
    }
}