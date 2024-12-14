import JourneyGenerator from './JourneyGenerator';
import wdi5PageGenerator from './wdi5PageGenerator';
import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from './wdi5Templates';

export default class wdi5Generator extends JourneyGenerator {
    _getPageImports(bTS: boolean): string {
        return Object.keys(this._pages).map(sP =>
            this._replacePlaceholders(
                this._getImportTemplate(bTS).slice(),
                { "page-name": sP })
        ).join("\n") + (Object.keys(this._pages).length > 0 ? "\n\n" : "");
    }
    _getPageGenerator(sPageName: string, sPageHash: string): wdi5PageGenerator {
        return new wdi5PageGenerator(sPageName, sPageHash);
    }

    _getJourneyTemplate(bTS: boolean): string {
        return bTS ? TSTemplate : JSTemplate;
    }

    _getMethodTemplate(bTS: boolean): string {
        return "\n\t\t//{{step-comment}}\n\t\t{{page-name}}.{{function-name}}();";
    }

    _getImportTemplate(bTS: boolean): string {
        return bTS ? TSImportTemplate : JSImportTemplate;
    }
}