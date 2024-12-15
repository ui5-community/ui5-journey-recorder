import { JSMethodImplementationTemplate, JSPageTemplate, JSActionImportTemplate, TSMethodImplementationTemplate, TSPageTemplate, TSActionImportTemplate, ActionsTemplate } from './opa5Templates';
import { PageGenerator } from './PageGenerator';


export default class opa5PageTemplate extends PageGenerator {

    constructor(sViewName: string, sPageHash: string) {
        super(sViewName, sPageHash);
    }

    _getPageTemplate(bTS: boolean = false) {
        return bTS ? TSPageTemplate : JSPageTemplate;
    }

    _getActionMethodTemplate(bTS: boolean = false) {
        return bTS ? TSMethodImplementationTemplate : JSMethodImplementationTemplate;
    }

    _getValidationMethodTemplate(bTS: boolean = false) {
        return bTS ? TSMethodImplementationTemplate : JSMethodImplementationTemplate;
    }
    

    addMethod(oStep: Record<string, unknown>) {
        this._addActionImport(oStep);
        this._addMethodImplementation(oStep);
    }

    generate(bTS: boolean = false): string {
        const sGeneratedText = this._getPageTemplate(bTS);
        const sActionTemplate = this._getActionMethodTemplate(bTS);
        const sAssertTemplate = this._getValidationMethodTemplate(bTS);
        const sImportTemplate = bTS ? TSActionImportTemplate : JSActionImportTemplate;

        const placeholders = {
            "view-name": this._view_path,
            "page-name": this._view_path.substring(this._view_path.lastIndexOf(".") + 1),
            "action-import": (bTS ? "\n" : ",\n") + this._action_imports.map(cls => sImportTemplate.slice().replaceAll("{{action-class}}", cls)).join(bTS ? "\n" : ",\n"),
            "action-class": (this._action_imports.length > 0 ? ', ' : '') + this._action_imports.join(", "),
            "actions-ref": this._generateActions(sActionTemplate, bTS),
            "assert-ref": this._generateValidations(sAssertTemplate, bTS)

        }
        return this._replacePlaceholders(sGeneratedText, placeholders);
    }

    _generateValidations(sTemplate: string, bTS: boolean): string {
        if (this._validations.length > 0) {
            let validationString = "";
            if (bTS) {
                validationString += this._validations.map(oAssert => this._generateMethod(oAssert, sTemplate, bTS)).join("\n");
            } else {
                if (this._actions.length > 0) {
                    validationString += ",";
                }
                validationString += `\n\t\t\tassertions: {${this._validations.map(oAssert => this._generateMethod(oAssert, sTemplate, bTS)).join(",\n")}\n\t\t\t}`;
            }
            return validationString;
        } else {
            return '';
        }
    }

    _generateActions(sTemplate: string, bTS: boolean): string {
        if (this._actions.length > 0) {
            return bTS ? this._actions.map(oAction => this._generateMethod(oAction, sTemplate, bTS)).join('\n')
                : `\n\t\t\tactions: {${this._actions.map(oAction => this._generateMethod(oAction, sTemplate, bTS)).join(',\n')}\n\t\t\t}`;
        } else {
            return ""
        }
    }

    _getPageGenerator(sPageName: string, sPageHash: string): opa5PageTemplate {
        return new opa5PageTemplate(sPageName, sPageHash);
    }

    private _generateMethod(method: Record<string, string>, template: string, bTS: boolean = false): string {
        method["action-create"] = method["action-type"] !== "" ? (bTS ? "\n" : "\n\t\t\t") + this._replacePlaceholders(ActionsTemplate, method) : "";
        return this._replacePlaceholders(template, method)
    }

    private _addMethodImplementation(oStep: Record<string, unknown>) {
        const sMethodName = this._genMethodNameForStep(oStep);
        const sActionClassName = this._getActionClassByStep(oStep);
        const oControl = oStep.control as Record<string, unknown>;
        const sControlClass = (oControl.type as string).substring((oControl.type as string).lastIndexOf(".") + 1);
        const sControlId = (oControl.controlId as Record<string, unknown>).id as string;

        const oMethodParameter = {
            "method-name": sMethodName,
            "success-message": "",
            "error-message": "",
            "action-type": sActionClassName,
            "step-selector": this._createStepSelector(oStep)
        }

        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter["success-message"] = `Successfull executed '${sActionClassName}' on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to ${sActionClassName}, ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`
                this._validations.push(oMethodParameter);
                break;
        }
    }

    private _addActionImport(oStep: Record<string, unknown>) {
        const sActionClass = this._getActionClassByStep(oStep);
        if (sActionClass !== "" && !this._action_imports.includes(sActionClass)) {
            this._action_imports.push(sActionClass);
        }
    }

    private _getActionClassByStep(oStep: Record<string, unknown>): string {
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