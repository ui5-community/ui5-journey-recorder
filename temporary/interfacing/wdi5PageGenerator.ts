import { MethodParameters, PageGenerator, StepControl } from './PageGenerator';
import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from './wdi5Templates';

export default class wdi5PageGenerator extends PageGenerator {
    constructor(sViewName: string, sPageHash: string) {
        super(sViewName, sPageHash);
    }

    _getPageTemplate(bTS: boolean = false): string {
        return bTS ? TSPageTemplate : JSPageTemplate;
    }

    _getActionMethodTemplate(bTS: boolean = false): string {
        return bTS ? TSActionMethodTemplate : JSActionMethodTemplate;
    }

    _getValidationMethodTemplate(bTS: boolean = false): string {
        return bTS ? TSAssertionMethodTemplate : JSAssertionMethodTemplate;
    }

    _generateValidations(bTS: boolean): string {
        const sOrgString = super._generateValidations(bTS);
        return sOrgString !== "" ? `\n${sOrgString}\n` : "";
    }

    _generateActions(bTS: boolean): string {
        const sOrgString = super._generateActions(bTS);
        return sOrgString !== "" ? `\n${sOrgString}\n` : "";
    }

    _addMethodImplementation(oStep: Record<string, unknown>): void {
        const oParameters: MethodParameters = {
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep),
            "control-class": this._getControlClassAndPath(oStep)["control-class"],
            "action-method": "",
            "action-parameter": ""
        }
        switch (oStep.actionType) {
            case 'clicked':
                oParameters["action-method"] = "press";
                this._actions.push(oParameters);
                break;
            case 'input':
                oParameters["action-method"] = "enterText";
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                oParameters["action-parameter"] = `"${sText}"`;
                this._actions.push(oParameters);
                break;
            case 'validate':
                this._validations.push(oParameters);
                break;
        }

    }

    _addAdditionalImport(oStep: Record<string, unknown>): void {
        const oControlInfo = this._getControlClassAndPath(oStep);
        if (!this._additional_imports.find(oI => oI["control-class"] === oControlInfo["control-class"])) {
            this._additional_imports.push(oControlInfo);
        }
    }

    generate(bTS: boolean): string {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sPage = super.generate(bTS);
        const oAdditionalReplacements = {
            "additional-imports": "\n" + this._additional_imports.map(oAI => this._replacePlaceholders(sImportTemplate, oAI)).filter(sI => sI !== "").join("\n") + "\n", //replace with additional-imports
        }
        return this._replacePlaceholders(sPage, oAdditionalReplacements)
    }

    private _getImportTemplate(bTS: boolean = false): string {
        return bTS ? TSControlImport : "";
    }

    private _getControlClassAndPath(oStep: Record<string, unknown>): { "control-class": string, "control-lib-path": string } {
        const sType = (oStep["control"] as StepControl).type;
        return {
            "control-class": sType.slice(sType.lastIndexOf(".") + 1),
            "control-lib-path": sType.replaceAll(".", "/")
        }
    }
}