import { StepType } from "../../../enum/StepType";
import { InputStep, Step } from "../../Step.class";
import { MethodParameters, PageGenerator } from "../common/PageGenerator.class";
import { PageTemplates } from "./Wdi5Templates";

export default class Wdi5Page extends PageGenerator {
    constructor(sViewName: string, sPageHash: string) {
        super(sViewName, sPageHash);
    }

    /** ABSTRACTS **/
    _addMethodImplementation(oStep: Step): void {
        const oParameters: MethodParameters = {
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep),
            "control-class": this._getControlClassAndPath(oStep)["control-class"],
            "action-method": "",
            "action-parameter": ""
        }
        switch (oStep.actionType) {
            case StepType.CLICK:
                oParameters["action-method"] = "press";
                this._actions.push(oParameters);
                break;
            case StepType.INPUT:
                oParameters["action-method"] = "enterText";
                oParameters["action-parameter"] = `"${(oStep as InputStep).getResultText()}"`;
                this._actions.push(oParameters);
                break;
            case StepType.VALIDATION:
                this._validations.push(oParameters);
                break;
        }
    }

    _performAdditionals(oStep: Step): void {
        const oControlInfo = this._getControlClassAndPath(oStep);
        if (!this._additional_imports.find(oI => oI["control-class"] === oControlInfo["control-class"])) {
            this._additional_imports.push(oControlInfo);
        }
    }

    _getPageTemplate(bTS: boolean): string {
        return bTS ? PageTemplates.TS.Page : PageTemplates.JS.Page;
    }

    _getActionMethodTemplate(bTS: boolean): string {
        return bTS ? PageTemplates.TS.ActionMethod : PageTemplates.JS.ActionMethod;
    }

    _getValidationMethodTemplate(bTS: boolean): string {
        return bTS ? PageTemplates.TS.ValidationMethod : PageTemplates.JS.ValidationMethod;
    }

    /** OVERRIDES **/
    _generateValidations(bTS: boolean): string {
        const sOrgString = super._generateValidations(bTS);
        return sOrgString !== "" ? `\n${sOrgString}\n` : "";
    }

    _generateActions(bTS: boolean): string {
        const sOrgString = super._generateActions(bTS);
        return sOrgString !== "" ? `\n${sOrgString}\n` : "";
    }

    generate(bTS: boolean): string {
        const sImportTemplate = this._getImportTemplate(bTS);
        const sPage = super.generate(bTS);
        const oAdditionalReplacements = {
            "additional-imports": "\n" + this._additional_imports.map(oAI => this._replacePlaceholders(sImportTemplate, oAI)).filter(sI => sI !== "").join("\n") + "\n",
        }
        return this._replacePlaceholders(sPage, oAdditionalReplacements)
    }

    generateStepOnly(oStep: Step, bTS?: boolean): string {
        const sOrgString = super.generateStepOnly(oStep, bTS);
        const oParameters = {
            "control-class": this._getControlClassAndPath(oStep)["control-class"],
            "action-method": "",
            "action-parameter": ""
        }
        switch (oStep.actionType) {
            case StepType.CLICK:
                oParameters["action-method"] = "press";
                this._actions.push(oParameters);
                break;
            case StepType.INPUT:
                oParameters["action-method"] = "enterText";
                oParameters["action-parameter"] = `"${(oStep as InputStep).getResultText()}"`;
                this._actions.push(oParameters);
                break;
            case StepType.VALIDATION:
                this._validations.push(oParameters);
                break;
        }
        return this._replacePlaceholders(sOrgString, oParameters)
    }

    private _getImportTemplate(bTS: boolean = false): string {
        return bTS ? PageTemplates.TS.ControlImport : "";
    }

    private _getControlClassAndPath(oStep: Step): { "control-class": string, "control-lib-path": string } {
        const sType = oStep.control.type;
        return {
            "control-class": sType.slice(sType.lastIndexOf(".") + 1),
            "control-lib-path": sType.replaceAll(".", "/")
        }
    }

}