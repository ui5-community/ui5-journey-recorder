import JourneyGenerator from "../common/JourneyGenerator.class";
import OPA5Page from "./OPA5Page.class";
import { JourneyTemplates } from "./OPA5Templates";

export default class OPA5Journey extends JourneyGenerator {
    _getPageImports(bTS: boolean): string {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sAffix = bTS ? '\n' : ',\n';
        return sAffix + Object.keys(this._pages).map(sP =>
            this._replacePlaceholders(sImportTemplate.slice(), { "page-name": sP })
        ).join(sAffix);
    }

    _getJourneyTemplate(bTS: boolean = false): string {
        return bTS ? JourneyTemplates.TS.Journey : JourneyTemplates.JS.Journey;
    }

    _getMethodTemplate(bTS: boolean = false): string {
        return bTS ? JourneyTemplates.TS.JourneyMethod : JourneyTemplates.JS.JourneyMethod;
    }

    _getImportTemplate(bTS: boolean = false): string {
        return bTS ? JourneyTemplates.TS.PageImport : JourneyTemplates.JS.PageImport;
    }

    _getPageGenerator(sPageName: string, sPageHash: string): OPA5Page {
        return new OPA5Page(sPageName, sPageHash);
    }
}