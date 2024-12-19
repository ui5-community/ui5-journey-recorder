import Generator from './Generator.mjs';
export class PageGenerator extends Generator {
    _view_path = "";
    _view_hash = "";
    _actions = [];
    _validations = [];
    _additional_imports = [];
    constructor(sViewName, sPageHash) {
        super();
        this._view_path = sViewName;
        this._view_hash = sPageHash;
    }
    addMethod(oStep) {
        this._addAdditionalImport(oStep);
        this._addMethodImplementation(oStep);
    }
    generate(bTS = false) {
        const sTemplate = this._getPageTemplate(bTS);
        const oReplacements = {
            "page-name": this._view_path.slice(this._view_path.lastIndexOf(".") + 1),
            "page-path": this._view_path,
            "page-hash": this._view_hash.slice(this._view_hash.lastIndexOf("#")),
            "actions-ref": this._generateActions(bTS),
            "assert-ref": this._generateValidations(bTS),
        };
        return this._replacePlaceholders(sTemplate, oReplacements);
    }
    _generateActions(bTS = false) {
        if (this._actions.length === 0) {
            return "";
        }
        const sTemplate = this._getActionMethodTemplate(bTS);
        return this._actions.map(oAction => this._replacePlaceholders(sTemplate.slice(), oAction)).join("\n");
    }
    _generateValidations(bTS = false) {
        if (this._validations.length === 0) {
            return "";
        }
        const sAssertTemplate = this._getValidationMethodTemplate(bTS);
        return this._validations.map(oValidation => this._replacePlaceholders(sAssertTemplate.slice(), oValidation)).join("\n");
    }
    _createStepSelector(oStep) {
        let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
        return sStepSelector.replaceAll(/\n/gm, '\n\t\t');
    }
}
