import PageGenerator from './PageGenerator.mjs';
import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from './wdi5Templates.mjs';
export default class wdi5PageGenerator extends PageGenerator {
    _control_imports = [];
    _actions = [];
    _validations = [];
    _view_path = "";
    _view_hash = "";
    constructor(sViewName, sPageHash) {
        super();
        this._view_path = sViewName;
        this._view_hash = sPageHash;
    }
    generate(bTS) {
        const sTemplate = bTS ? TSPageTemplate : JSPageTemplate;
        const oMethodTemplates = bTS ? {
            actionMethod: TSActionMethodTemplate,
            assertMethod: TSAssertionMethodTemplate
        } : {
            actionMethod: JSActionMethodTemplate,
            assertMethod: JSAssertionMethodTemplate
        };
        const oReplacements = {
            "control-imports": this._control_imports.length > 0 ? "\n" + this._control_imports.join("\n") + "\n" : "",
            "page-name": this._view_path.slice(this._view_path.lastIndexOf(".") + 1),
            "page-path": this._view_path,
            "page-hash": this._view_hash.slice(this._view_hash.lastIndexOf("#")),
            "actions-ref": this._generateActions(oMethodTemplates.actionMethod, bTS),
            "assert-ref": this._generateValidations(oMethodTemplates.assertMethod, bTS),
        };
        return this._replacePlaceholders(sTemplate, oReplacements);
    }
    addMethod(oStep) {
        this._addControlImport(oStep);
        this._addMethodImplementation(oStep);
    }
    _generateValidations(sTemplate, bTS) {
        if (this._validations.length > 0) {
            return "\n\n" + this._validations.map(oValidation => this._replacePlaceholders(sTemplate.slice(), oValidation)).join("\n\n") + "\n";
        }
        else {
            return "";
        }
    }
    _generateActions(sTemplate, bTS) {
        if (this._actions.length > 0) {
            return "\n\n" + this._actions.map(oAction => this._replacePlaceholders(sTemplate.slice(), oAction)).join("\n\n") + "\n";
        }
        else {
            return "";
        }
    }
    _getPageGenerator(sPageName, sPageHash) {
        return this;
    }
    _addMethodImplementation(oStep) {
        const oParameters = {
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep),
            "control-class": this._getControlClassAndPath(oStep)["control-class"],
            "action-method": "",
            "action-parameter": ""
        };
        switch (oStep.actionType) {
            case 'input':
                oParameters["action-method"] = "enterText";
                const sText = oStep.keys.reduce((sAgg, oKey) => `${sAgg}${oKey.key}`, "");
                oParameters["action-parameter"] = `"${sText}"`;
                this._actions.push(oParameters);
                break;
            case 'clicked':
                oParameters["action-method"] = "press";
                this._actions.push(oParameters);
                break;
            case 'validate':
                this._validations.push(oParameters);
                break;
        }
    }
    _addControlImport(oStep) {
        const sImport = this._replacePlaceholders(TSControlImport, this._getControlClassAndPath(oStep));
        if (!this._control_imports.includes(sImport)) {
            this._control_imports.push(sImport);
        }
    }
    _getControlClassAndPath(oStep) {
        const sType = oStep["control"].type;
        return {
            "control-class": sType.slice(sType.lastIndexOf(".") + 1),
            "control-lib-path": sType.replaceAll(".", "/")
        };
    }
}
