import JourneyGenerator from './JourneyGenerator.mjs';
import wdi5PageGenerator from './wdi5PageGenerator.mjs';
import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from './wdi5Templates.mjs';
export default class wdi5Generator extends JourneyGenerator {
    _getPageImports(bTS) {
        return Object.keys(this._pages).map(sP => this._replacePlaceholders(this._getImportTemplate(bTS).slice(), { "page-name": sP })).join("\n") + (Object.keys(this._pages).length > 0 ? "\n\n" : "");
    }
    _getPageGenerator(sPageName, sPageHash) {
        return new wdi5PageGenerator(sPageName, sPageHash);
    }
    _getJourneyTemplate(bTS) {
        return bTS ? TSTemplate : JSTemplate;
    }
    _getMethodTemplate(bTS) {
        return "\n\t\t//{{step-comment}}\n\t\t{{page-name}}.{{function-name}}();";
    }
    _getImportTemplate(bTS) {
        return bTS ? TSImportTemplate : JSImportTemplate;
    }
}
