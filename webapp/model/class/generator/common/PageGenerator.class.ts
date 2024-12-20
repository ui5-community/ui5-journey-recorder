import { StepType } from "../../../enum/StepType";
import { Step } from "../../Step.class";
import Generator from "./Generator.class";

export type MethodParameters = {
    "method-name"?: string,
    "success-message"?: string,
    "error-message"?: string,
    "action-type"?: string,
    "action-create"?: string,
    "step-selector"?: string,
    "control-class"?: string,
    "action-method"?: string,
    "action-parameter"?: string
};

export abstract class PageGenerator extends Generator {
    _view_path: string = "";
    _view_hash: string = "";
    _actions: MethodParameters[] = [];
    _validations: MethodParameters[] = [];
    _additional_imports: {
        "control-class": string,
        "control-lib-path": string
    }[] = [];

    constructor(sViewName: string, sPageHash: string) {
        super();
        this._view_path = sViewName;
        this._view_hash = sPageHash;
    }

    abstract _addMethodImplementation(oStep: Step): void;
    abstract _performAdditionals(oStep: Step): void;
    abstract _getPageTemplate(bTS: boolean): string;
    abstract _getActionMethodTemplate(bTS: boolean): string;
    abstract _getValidationMethodTemplate(bTS: boolean): string;

    addMethod(oStep: Step): void {
        this._addMethodImplementation(oStep);
        this._performAdditionals(oStep);
    }

    generate(bTS: boolean = false): string {
        const sTemplate = this._getPageTemplate(bTS);
        const oReplacements = {
            "page-name": this._view_path.slice(this._view_path.lastIndexOf(".") + 1),
            "page-path": this._view_path,
            "page-hash": this._view_hash.slice(this._view_hash.lastIndexOf("#")),

            "actions-ref": this._generateActions(bTS),
            "assert-ref": this._generateValidations(bTS),
        }
        return this._replacePlaceholders(sTemplate, oReplacements);
    }

    generateStepOnly(oStep: Step, bTS: boolean = false): string {
        const oMethodParameter: MethodParameters = {
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep)
        }

        switch (oStep.actionType) {
            case StepType.CLICK:
            case StepType.INPUT:
                return this._replacePlaceholders(this._getActionMethodTemplate(bTS), oMethodParameter);
            case StepType.VALIDATION:
                return this._replacePlaceholders(this._getValidationMethodTemplate(bTS), oMethodParameter);
            default:
                return "";
        }
    }

    _generateActions(bTS: boolean = false) {
        if (this._actions.length === 0) {
            return "";
        }

        const sTemplate = this._getActionMethodTemplate(bTS);
        return this._actions.map(oAction =>
            this._replacePlaceholders(sTemplate.slice(), oAction)
        ).join("\n");
    }

    _generateValidations(bTS: boolean = false) {
        if (this._validations.length === 0) {
            return "";
        }

        const sAssertTemplate = this._getValidationMethodTemplate(bTS);
        return this._validations.map(oValidation =>
            this._replacePlaceholders(sAssertTemplate.slice(), oValidation)
        ).join("\n");
    }

    _createStepSelector(oStep: Step): string {
        let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
        return sStepSelector.replaceAll(/\n/gm, '\n\t\t');
    }
}