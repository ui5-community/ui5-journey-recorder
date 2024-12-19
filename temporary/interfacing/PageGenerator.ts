import Generator from './Generator';

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

export type StepControl = {
    controlId: {
        id: string,
        use: boolean
    },
    type: string,
    properties: { name: string, value: unknown, use: boolean }[]
}

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

    abstract _getPageTemplate(bTS: boolean): string;
    abstract _getActionMethodTemplate(bTS: boolean): string;
    abstract _getValidationMethodTemplate(bTS: boolean): string;
    abstract _addAdditionalImport(oStep: Record<string, unknown>): void;
    abstract _addMethodImplementation(oStep: Record<string, unknown>): void;

    addMethod(oStep: Record<string, unknown>): void {
        this._addAdditionalImport(oStep);
        this._addMethodImplementation(oStep);
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

    _createStepSelector(oStep: Record<string, unknown>): string {
        let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
        return sStepSelector.replaceAll(/\n/gm, '\n\t\t');
    }
}