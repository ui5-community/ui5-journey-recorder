import AbstractGenerator from './AbstractGenerator.mjs';
import wdi5PageGenerator from './wdi5PageGenerator.mjs';
import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate, TSGeneralPageTemplate } from './wdi5Templates.mjs';
export default class wdi5Generator extends AbstractGenerator {
    setJourneyJSON(oJourneyJSON) {
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }
    generate(bTS = false) {
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
                return this._replacePlaceholders("\n\t\t//{{step-comment}}\n\t\t{{page-name}}.{{function-name}}();", stepClone);
            }).join("\n")
        };
        return this._replacePlaceholders(sGeneratedText, placeholders);
    }
    generatePages(bTS = false) {
        const pages = Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTS) }));
        if (pages.length > 0) {
            pages.push({ pageName: '', pageContent: TSGeneralPageTemplate });
        }
        return pages;
    }
    _getPageGenerator(sPageName, sPageHash) {
        return new wdi5PageGenerator(sPageName, sPageHash);
    }
}
