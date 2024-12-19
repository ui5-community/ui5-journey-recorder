import { JSMethodImplementationTemplate, JSPageTemplate, JSActionImportTemplate, TSMethodImplementationTemplate, TSPageTemplate, TSActionImportTemplate, ActionsTemplate } from './opa5Templates.mjs';
import { PageGenerator } from './PageGenerator.mjs';
export default class opa5PageTemplate extends PageGenerator {
    constructor(sViewName, sPageHash) {
        super(sViewName, sPageHash);
    }
    _getPageTemplate(bTS = false) {
        return bTS ? TSPageTemplate : JSPageTemplate;
    }
    _getActionMethodTemplate(bTS = false) {
        return bTS ? TSMethodImplementationTemplate : JSMethodImplementationTemplate;
    }
    _getValidationMethodTemplate(bTS = false) {
        return bTS ? TSMethodImplementationTemplate : JSMethodImplementationTemplate;
    }
    _generateValidations(bTS) {
        const sOrgString = super._generateValidations(bTS);
        return bTS ? sOrgString :
            sOrgString !== "" ? ((this._validations.length > 0 ? ',' : '') +
                `\n\t\t\tassertions: { ${sOrgString} \n\t\t\t}`) : "";
    }
    _generateActions(bTS) {
        let sOrgString = super._generateActions(bTS);
        if (bTS) {
            return sOrgString;
        }
        else {
            sOrgString = sOrgString.split("\n").map(sPart => `\t\t\t${sPart}`).join('\n');
        }
        return bTS ? sOrgString : (sOrgString !== "" ? `\n\t\t\tactions: {${sOrgString}\n\t\t\t}` : "");
    }
    _addMethodImplementation(oStep) {
        const oControl = oStep.control;
        const sControlClass = oControl.type.substring(oControl.type.lastIndexOf(".") + 1);
        const sControlId = oControl.controlId.id;
        const oMethodParameter = {
            "success-message": "",
            "error-message": "",
            "action-method": "",
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep)
        };
        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter["success-message"] = `Successfull executed clicked on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to click, ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(ActionsTemplate, { "action-method": "Press", "action-parameter": "" });
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = oStep.keys.reduce((sAgg, oKey) => `${sAgg}${oKey.key}`, "");
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["action-method"] = '\n' + this._replacePlaceholders(ActionsTemplate, { "action-method": "EnterText", "action-parameter": `{text: "${sText}", pressEnterKey: true }` });
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`;
                this._validations.push(oMethodParameter);
                break;
        }
    }
    _addAdditionalImport(oStep) {
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
            });
        }
    }
    generate(bTS = false) {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sPage = super.generate(bTS);
        const oAdditionalReplacements = {
            //replace with additional imports
            "additional-imports": (bTS ? "\n" : ",\n") + this._additional_imports.map(cls => this._replacePlaceholders(sImportTemplate, cls)).join(bTS ? "\n" : ",\n"),
            "additional-class": (this._additional_imports.length > 0 ? ', ' : '') + this._additional_imports.map(oAI => oAI["control-class"]).join(", ")
        };
        return this._replacePlaceholders(sPage, oAdditionalReplacements);
    }
    _getImportTemplate(bTS = false) {
        return bTS ? TSActionImportTemplate : JSActionImportTemplate;
    }
}
