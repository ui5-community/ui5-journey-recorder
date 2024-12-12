import { JSMethodTemplate, JSPageTemplate, JSImportTemplate, TSMethodTemplate, TSPageTemplate, TSImportTemplate, ActionsTemplate } from './PageTemplates.mjs';
import AbstractPageGenerator from './AbstractPageGenerator.mjs';
export default class PageTemplate extends AbstractPageGenerator {
    _view_path = "";
    _view_hash = "";
    _actions = [];
    _assertions = [];
    _action_imports = [];
    constructor(sViewName, sPageHash) {
        super();
        this._view_path = sViewName;
        this._view_hash = sPageHash;
    }
    addMethod(oStep) {
        this._addActionImport(oStep);
        this._addMethodImplementation(oStep);
    }
    generate(bTS = false) {
        let sGeneratedText = bTS ? TSPageTemplate : JSPageTemplate;
        const sMethodTemplate = bTS ? TSMethodTemplate : JSMethodTemplate;
        const sImportTemplate = bTS ? TSImportTemplate : JSImportTemplate;
        const placeholders = {
            "view-name": this._view_path,
            "page-name": this._view_path.substring(this._view_path.lastIndexOf(".") + 1),
            "action-import": (bTS ? "\n" : ",\n") + this._action_imports.map(cls => sImportTemplate.slice().replaceAll("{{action-class}}", cls)).join(bTS ? "\n" : ",\n"),
            "action-class": (this._action_imports.length > 0 ? ', ' : '') + this._action_imports.join(", ")
        };
        // create the general page setup
        sGeneratedText = this._replacePlaceholders(sGeneratedText, placeholders);
        if (this._actions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", bTS ? this._generateMethods(this._actions, sMethodTemplate, bTS)
                : `\n\t\t\tactions: {${this._generateMethods(this._actions, sMethodTemplate, bTS)}\n\t\t\t}`);
        }
        else {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", "");
        }
        if (this._assertions.length > 0) {
            if (!bTS && this._actions.length > 0) {
                sGeneratedText = sGeneratedText.replace("{{assert-ref}}", ",{{assert-ref}}");
            }
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", bTS ? this._generateMethods(this._assertions, sMethodTemplate, bTS)
                : `\n\t\t\tassertions: {${this._generateMethods(this._assertions, sMethodTemplate, bTS)}\n\t\t\t}`);
        }
        else {
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", "");
        }
        return sGeneratedText;
    }
    _getPageGenerator(sPageName, sPageHash) {
        return new PageTemplate(sPageName, sPageHash);
    }
    _generateMethods(methods, template, bTS = false) {
        return methods
            .map(method => {
            method["action-create"] = method["action-type"] !== "" ? (bTS ? "\n" : "\n\t\t\t") + this._replacePlaceholders(ActionsTemplate, method) : "";
            return this._replacePlaceholders(template, method);
        })
            .join(`${bTS ? '' : ','}\n`);
    }
    _addMethodImplementation(oStep) {
        const sMethodName = this._genMethodNameForStep(oStep);
        const sActionClassName = this._getActionClassByStep(oStep);
        const oControl = oStep.control;
        const sControlClass = oControl.type.substring(oControl.type.lastIndexOf(".") + 1);
        const sControlId = oControl.controlId.id;
        const oMethodParameter = {
            "method-name": sMethodName,
            "success-message": "",
            "error-message": "",
            "action-type": sActionClassName,
            "step-selector": this._createStepSelector(oStep)
        };
        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter["success-message"] = `Successfull executed '${sActionClassName}' on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to ${sActionClassName}, ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = oStep.keys.reduce((sAgg, oKey) => `${sAgg}${oKey.key}`, "");
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`;
                this._assertions.push(oMethodParameter);
                break;
        }
    }
    _addActionImport(oStep) {
        const sActionClass = this._getActionClassByStep(oStep);
        if (sActionClass !== "" && !this._action_imports.includes(sActionClass)) {
            this._action_imports.push(sActionClass);
        }
    }
    _getActionClassByStep(oStep) {
        switch (oStep.actionType) {
            case 'input':
                return "EnterText";
            case 'clicked':
                return "Press";
            default:
                return "";
        }
    }
}
