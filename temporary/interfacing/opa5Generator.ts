import JourneyGenerator from './JourneyGenerator';
import opa5PageGenerator from './opa5PageGenerator';
import { JSImportTemplate, JSMethodTemplate, JSTemplate, TSImportTemplate, TSMethodTemplate, TSTemplate } from './opa5Templates';

export default class opa5Generator extends JourneyGenerator {
    _getPageImports(bTS: boolean): string {
        return (bTS ? "\n" : ",\n") +
            Object.keys(this._pages).map(sP =>
                this._replacePlaceholders(
                    this._getImportTemplate(bTS).slice(),
                    { "page-name": sP })
            ).join(bTS ? "\n" : ",\n");
    }
    _getJourneyTemplate(bTS: boolean = false): string {
        return bTS ? TSTemplate : JSTemplate;
    }

    _getMethodTemplate(bTS: boolean = false): string {
        return bTS ? TSMethodTemplate : JSMethodTemplate;
    }

    _getImportTemplate(bTS: boolean = false): string {
        return bTS ? TSImportTemplate : JSImportTemplate;
    }

    _getPageGenerator(sPageName: string, sPageHash: string): opa5PageGenerator {
        return new opa5PageGenerator(sPageName, sPageHash);
    }
}