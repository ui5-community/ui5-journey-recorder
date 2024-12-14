import JourneyGenerator from './JourneyGenerator.mjs';
import opa5PageGenerator from './opa5PageGenerator.mjs';
import { JSImportTemplate, JSMethodTemplate, JSTemplate, TSImportTemplate, TSMethodTemplate, TSTemplate } from './opa5Templates.mjs';
export default class opa5Generator extends JourneyGenerator {
    _getPageImports(bTS) {
        return (bTS ? "\n" : ",\n") +
            Object.keys(this._pages).map(sP => this._replacePlaceholders(this._getImportTemplate(bTS).slice(), { "page-name": sP })).join(bTS ? "\n" : ",\n");
    }
    _getJourneyTemplate(bTS = false) {
        return bTS ? TSTemplate : JSTemplate;
    }
    _getMethodTemplate(bTS = false) {
        return bTS ? TSMethodTemplate : JSMethodTemplate;
    }
    _getImportTemplate(bTS = false) {
        return bTS ? TSImportTemplate : JSImportTemplate;
    }
    _getPageGenerator(sPageName, sPageHash) {
        return new opa5PageGenerator(sPageName, sPageHash);
    }
}
