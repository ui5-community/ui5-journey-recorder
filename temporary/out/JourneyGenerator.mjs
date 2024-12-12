import AbstractGenerator from './AbstractGenerator.mjs';
import PageGenerator from './PageGenerator.mjs';
import { JSTemplate, JSMethodTemplate, TSTemplate, TSMethodTemplate, JSImportTemplate, TSImportTemplate, TSPageConstantTemplate } from './JourneyTemplates.mjs';
export default class JourneyGenerator extends AbstractGenerator {
    _appPrefix;
    setJourneyJSON(oJourneyJSON) {
        this._extractAppPrefix(oJourneyJSON);
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }
    _extractAppPrefix(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        if (aSteps.length > 0) {
            const sFirstPageName = aSteps[0]["viewInfos"];
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }
    generate(bTS = false) {
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
                return this._replacePlaceholders(sMethodTemplate.slice(), stepClone);
            }).join('\n\n') + '\n'
        };
        return this._replacePlaceholders(sJourneyTemplate, placeholders);
    }
    generatePages(bTypeScript = false) {
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTypeScript) }));
    }
    _getPageGenerator(sPageName, sPageHash) {
        return new PageGenerator(sPageName, sPageHash);
    }
}
