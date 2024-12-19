import { PageGenerator } from './PageGenerator.mjs';
import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from './wdi5Templates.mjs';
export default class wdi5PageGenerator extends PageGenerator {
    constructor(sViewName, sPageHash) {
        super(sViewName, sPageHash);
    }
    _getPageTemplate(bTS = false) {
        return bTS ? TSPageTemplate : JSPageTemplate;
    }
    _getActionMethodTemplate(bTS = false) {
        return bTS ? TSActionMethodTemplate : JSActionMethodTemplate;
    }
    _getValidationMethodTemplate(bTS = false) {
        return bTS ? TSAssertionMethodTemplate : JSAssertionMethodTemplate;
    }
    _generateValidations(bTS) {
        const sOrgString = super._generateValidations(bTS);
        return sOrgString !== "" ? `\n${sOrgString}\n` : "";
    }
    _generateActions(bTS) {
        const sOrgString = super._generateActions(bTS);
        return sOrgString !== "" ? `\n${sOrgString}\n` : "";
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
            case 'clicked':
                oParameters["action-method"] = "press";
                this._actions.push(oParameters);
                break;
            case 'input':
                oParameters["action-method"] = "enterText";
                const sText = oStep.keys.reduce((sAgg, oKey) => `${sAgg}${oKey.key}`, "");
                oParameters["action-parameter"] = `"${sText}"`;
                this._actions.push(oParameters);
                break;
            case 'validate':
                this._validations.push(oParameters);
                break;
        }
    }
    _addAdditionalImport(oStep) {
        const oControlInfo = this._getControlClassAndPath(oStep);
        if (!this._additional_imports.find(oI => oI["control-class"] === oControlInfo["control-class"])) {
            this._additional_imports.push(oControlInfo);
        }
    }
    generate(bTS) {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sPage = super.generate(bTS);
        const oAdditionalReplacements = {
            "additional-imports": "\n" + this._additional_imports.map(oAI => this._replacePlaceholders(sImportTemplate, oAI)).filter(sI => sI !== "").join("\n") + "\n", //replace with additional-imports
        };
        return this._replacePlaceholders(sPage, oAdditionalReplacements);
    }
    _getImportTemplate(bTS = false) {
        return bTS ? TSControlImport : "";
    }
    _getControlClassAndPath(oStep) {
        const sType = oStep["control"].type;
        return {
            "control-class": sType.slice(sType.lastIndexOf(".") + 1),
            "control-lib-path": sType.replaceAll(".", "/")
        };
    }
}
