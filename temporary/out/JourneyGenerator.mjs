import Generator from './Generator.mjs';
export default class JourneyGenerator extends Generator {
    _appPrefix;
    _testName = "";
    _steps = [];
    _pages = {};
    setJourneyJSON(oJourneyJSON) {
        this._extractAppPrefix(oJourneyJSON);
        this._extractJourneyName(oJourneyJSON);
        this._extractSteps(oJourneyJSON);
        return this;
    }
    generate(bTS = false) {
        const sJourneyTemplate = this._getJourneyTemplate(bTS);
        const sMethodTemplate = this._getMethodTemplate(bTS);
        const placeholders = {
            "journey-name": this._testName,
            "test-intention": this._testName,
            "app-prefix": this._appPrefix,
            "page-first-name": Object.keys(this._pages).length > 0 ? Object.keys(this._pages)[0] : '<empty>',
            "page-user": '\n' + Object.keys(this._pages).map(sP => this._replacePlaceholders(`const onThe{{page-name}}Page = new {{page-name}}Page();`.slice(), { "page-name": sP })).join("\n"),
            "page-user-first": Object.keys(this._pages).length > 0 ? Object.keys(this._pages)[0] : '<empty>',
            "page-import": this._getPageImports(bTS),
            "step-insert": this._steps.map(oStep => {
                const stepClone = { ...oStep };
                delete stepClone.step;
                return this._replacePlaceholders(sMethodTemplate.slice(), stepClone);
            }).join('\n')
        };
        return this._replacePlaceholders(sJourneyTemplate, placeholders);
    }
    generatePages(bTypeScript = false) {
        return Object.entries(this._pages).map(eP => ({ pageName: eP[0], pageContent: eP[1].generate(bTypeScript) }));
    }
    _extractAppPrefix(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        if (aSteps.length > 0) {
            const sFirstPageName = aSteps[0]["viewInfos"];
            this._appPrefix = sFirstPageName.absoluteViewName.replace('.' + sFirstPageName.relativeViewName, '');
        }
        return this;
    }
    _extractJourneyName(oJourneyJSON) {
        this._testName = oJourneyJSON["name"];
    }
    _extractSteps(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        this._steps = aSteps.map((oStep) => {
            const oViewInfos = oStep["viewInfos"];
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sComment = (bAssertion ? ' Assertion' : ' Action') + (oStep.comment ? `: ${oStep.comment}` : '');
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;
            if (!this._pages[sPageName]) {
                const oViewInfos = oStep["viewInfos"];
                this._pages[sPageName] = this._getPageGenerator(oViewInfos.absoluteViewName, oStep.actionLocation);
            }
            this._pages[sPageName].addMethod(oStep);
            return {
                "step-comment": sComment,
                "step-type": sType,
                //"step-selector": sStepSelector,
                "page-name": sPageName,
                "function-name": sMethodName,
                "step": oStep
            };
        });
    }
}
