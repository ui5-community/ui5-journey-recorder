import { StepType } from "../../../enum/StepType";
import { InputStep, Step } from "../../Step.class";
import { PageGenerator, MethodParameters } from "../common/PageGenerator.class";
import { PageTemplates } from "./OPA5Templates";

export default class OPA5Page extends PageGenerator {
    constructor(sViewName: string, sPageHash: string) {
        super(sViewName, sPageHash);
    }

    /** ABSTRACTS **/
    _addMethodImplementation(oStep: Step): void {
        const oControl = oStep.control;
        const sControlClass = oControl.type.substring(oControl.type.lastIndexOf(".") + 1);
        const sControlId = oControl.controlId.id;

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
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(PageTemplates.NewAction, { "action-method": "Press", "action-parameter": "" });
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = (oStep as InputStep).getResultText();
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(PageTemplates.NewAction, { "action-method": "EnterText", "action-parameter": `{text: "${sText}", pressEnterKey: true }` });
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`
                this._validations.push(oMethodParameter);
                break;
        }
    }

    _performAdditionals(oStep: Step): void {
        let sActionClass = "";
        switch (oStep.actionType) {
            case StepType.INPUT:
                sActionClass = "EnterText";
                break;
            case StepType.CLICK:
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

    _getPageTemplate(bTS: boolean): string {
        return bTS ? PageTemplates.TS.Page : PageTemplates.JS.Page;
    }

    _getActionMethodTemplate(bTS: boolean): string {
        return bTS ? PageTemplates.TS.MethodImplementation : PageTemplates.JS.MethodImplementation;
    }

    _getValidationMethodTemplate(bTS: boolean): string {
        return bTS ? PageTemplates.TS.MethodImplementation : PageTemplates.JS.MethodImplementation;
    }

    /** OVERRIDES **/
    _generateActions(bTS?: boolean): string {
        let sOrgString = super._generateActions(bTS);
        if (bTS || sOrgString === "") {
            return sOrgString;
        } else {
            sOrgString = sOrgString.split("\n").map(sPart => `\t\t\t${sPart}`).join('\n');
            return `\n\t\t\tactions: {${sOrgString}\n\t\t\t}`;
        }
    }

    _generateValidations(bTS?: boolean): string {
        let sOrgString = super._generateValidations(bTS);

        if (bTS || sOrgString === "") {
            return sOrgString;
        } else {
            sOrgString = sOrgString.split("\n").map(sPart => `\t\t\t${sPart}`).join('\n');
            return (this._validations.length > 0 ? ',' : '') + `\n\t\t\tassertions: { ${sOrgString} \n\t\t\t}`;
        }
    }

    generate(bTS?: boolean): string {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sPage = super.generate(bTS);
        const oAdditionalReplacements = {
            //replace with additional imports
            "additional-imports": (bTS ? "\n" : ",\n") + this._additional_imports.map(cls => this._replacePlaceholders(sImportTemplate, cls)).join(bTS ? "\n" : ",\n"),
            "additional-class": (this._additional_imports.length > 0 ? ', ' : '') + this._additional_imports.map(oAI => oAI["control-class"]).join(", ")
        }
        return this._replacePlaceholders(sPage, oAdditionalReplacements);
    }

    generateStepOnly(oStep: Step, bTS?: boolean): string {
        const sOrgString = super.generateStepOnly(oStep, bTS);
        const oControl = oStep.control;
        const sControlClass = oControl.type.substring(oControl.type.lastIndexOf(".") + 1);
        const sControlId = oControl.controlId.id;
        const oMethodParameter = {
            "success-message": "",
            "error-message": "",
            "action-method": "",
        }

        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter["success-message"] = `Successfull executed clicked on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to click, ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(PageTemplates.NewAction, { "action-method": "Press", "action-parameter": "" });
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = (oStep as InputStep).getResultText();
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(PageTemplates.NewAction, { "action-method": "EnterText", "action-parameter": `{text: "${sText}", pressEnterKey: true }` });
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`
                this._validations.push(oMethodParameter);
                break;
        }

        return this._replacePlaceholders(sOrgString, oMethodParameter)
    }

    private _getImportTemplate(bTS: boolean = false): string {
        return bTS ? PageTemplates.TS.ActionImport : PageTemplates.JS.ActionImport;
    }
}