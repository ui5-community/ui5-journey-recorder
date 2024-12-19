import { JSMethodImplementationTemplate, JSPageTemplate, JSActionImportTemplate, TSMethodImplementationTemplate, TSPageTemplate, TSActionImportTemplate, ActionsTemplate } from './opa5Templates';
import { MethodParameters, PageGenerator } from './PageGenerator';


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

    _generateValidations(bTS: boolean): string {
        const sOrgString = super._generateValidations(bTS);

        return bTS ? sOrgString :
            sOrgString !== "" ? (
                (this._validations.length > 0 ? ',' : '') +
                `\n\t\t\tassertions: { ${sOrgString} \n\t\t\t}`) : "";
    }

    _generateActions(bTS: boolean): string {
        let sOrgString = super._generateActions(bTS);
        if (bTS) {
            return sOrgString;
        } else {
            sOrgString = sOrgString.split("\n").map(sPart => `\t\t\t${sPart}`).join('\n');
        }
        return bTS ? sOrgString : (sOrgString !== "" ? `\n\t\t\tactions: {${sOrgString}\n\t\t\t}` : "");
    }

    _addMethodImplementation(oStep: Record<string, unknown>) {
        const oControl = oStep.control as Record<string, unknown>;
        const sControlClass = (oControl.type as string).substring((oControl.type as string).lastIndexOf(".") + 1);
        const sControlId = (oControl.controlId as Record<string, unknown>).id as string;

        const oMethodParameter: MethodParameters = {
            "success-message": "",
            "error-message": "",
            "action-method": "",
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep)
        }

        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter["success-message"] = `Successfull executed clicked on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to click, ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(ActionsTemplate, { "action-method": "Press", "action-parameter": "" });
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(ActionsTemplate, { "action-method": "EnterText", "action-parameter": `{text: "${sText}", pressEnterKey: true }` });
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`
                this._validations.push(oMethodParameter);
                break;
        }
    }

    _addAdditionalImport(oStep: Record<string, unknown>) {
        let sActionClass = "";
        switch (oStep.actionType) {
            case 'input':
                sActionClass = "EnterText";
                break;
            case 'clicked':
                sActionClass = "Press";
                break;
        }
        if (sActionClass !== "" && !this._additional_imports.find(oAI => oAI["control-class"] === sActionClass)) {
            this._additional_imports.push({
                "control-class": `${sActionClass}`,
                "control-lib-path": `sap/ui/test/actions/${sActionClass}`
            })
        }
    }

    generate(bTS: boolean = false): string {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sPage = super.generate(bTS);
        const oAdditionalReplacements = {
            //replace with additional imports
            "additional-imports": (bTS ? "\n" : ",\n") + this._additional_imports.map(cls => this._replacePlaceholders(sImportTemplate, cls)).join(bTS ? "\n" : ",\n"),
            "additional-class": (this._additional_imports.length > 0 ? ', ' : '') + this._additional_imports.map(oAI => oAI["control-class"]).join(", ")
        }
        return this._replacePlaceholders(sPage, oAdditionalReplacements);
    }

    private _getImportTemplate(bTS: boolean = false): string {
        return bTS ? TSActionImportTemplate : JSActionImportTemplate;
    }
}