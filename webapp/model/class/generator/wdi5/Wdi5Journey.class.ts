import JourneyGenerator from "../common/JourneyGenerator.class";
import Wdi5Page from "./Wdi5Page.class";
import { JourneyTemplates } from "./Wdi5Templates";

export default class Wdi5Journey extends JourneyGenerator {
    _getPageGenerator(sPageName: string, sPageHash: string): Wdi5Page {
        return new Wdi5Page(sPageName, sPageHash);
    }

    _getJourneyTemplate(_: boolean): string {
        return JourneyTemplates.Journey;
    }

    _getMethodTemplate(_: boolean): string {
        return JourneyTemplates.JourneyMethod;
    }

    _getImportTemplate(bTS: boolean): string {
        return bTS ? JourneyTemplates.TS.PageImport : JourneyTemplates.JS.PageImport;
    }

    _getPageImports(bTS: boolean): string {
        const sImportTemplate = this._getImportTemplate(bTS);
        return Object.keys(this._pages).map(sP =>
            this._replacePlaceholders(sImportTemplate, { "page-name": sP })
        ).join("\n") + (Object.keys(this._pages).length > 0 ? "\n\n" : "")
    }

}