import AbstractGenerator from './AbstractGenerator.mjs';
import PageGenerator from './PageGenerator.mjs';
import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from './wdi5Templates.mjs';
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
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: '' }));
    }
    _getPageGenerator(sPageName) {
        return new PageGenerator(sPageName);
    }
}
