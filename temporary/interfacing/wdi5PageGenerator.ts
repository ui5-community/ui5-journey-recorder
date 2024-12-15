import { MethodParameters, PageGenerator } from './PageGenerator';
import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from './wdi5Templates';

type StepControl = {
    controlId: {
        id: string,
        use: boolean
    },
    type: string,
    properties: { name: string, value: unknown, use: boolean }[]
}

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


    addMethod(oStep: Record<string, unknown>): void {
        this._addControlImport(oStep);
        this._addMethodImplementation(oStep);
    }

    generate(bTS: boolean): string {
        const sTemplate = this._getPageTemplate(bTS);
        const sActionTemplate = this._getActionMethodTemplate(bTS);
        const sAssertTemplate = this._getValidationMethodTemplate(bTS);

        const oReplacements = {
            "control-imports": this._control_imports.length > 0 ? "\n" + this._control_imports.join("\n") + "\n" : "",
            "page-name": this._view_path.slice(this._view_path.lastIndexOf(".") + 1),
            "page-path": this._view_path,
            "page-hash": this._view_hash.slice(this._view_hash.lastIndexOf("#")),
            "actions-ref": this._generateActions(sActionTemplate, bTS),
            "assert-ref": this._generateValidations(sAssertTemplate, bTS),
        }

        return this._replacePlaceholders(sTemplate, oReplacements);
    }

    _generateValidations(sTemplate: string, bTS: boolean): string {
        if (this._validations.length > 0) {
            return "\n\n" + this._validations.map(oValidation => this._replacePlaceholders(sTemplate.slice(), oValidation)).join("\n\n") + "\n"
        } else {
            return "";
        }
    }

    _generateActions(sTemplate: string, bTS: boolean): string {
        if (this._actions.length > 0) {
            return "\n\n" + this._actions.map(oAction => this._replacePlaceholders(sTemplate.slice(), oAction)).join("\n\n") + "\n"
        } else {
            return "";
        }
    }

    _getPageGenerator(sPageName: string, sPageHash: string): wdi5PageGenerator {
        return this;
    }

    private _addMethodImplementation(oStep: Record<string, unknown>): void {
        const oParameters: MethodParameters = {
            "method-name": this._genMethodNameForStep(oStep),
            "step-selector": this._createStepSelector(oStep),
            "control-class": this._getControlClassAndPath(oStep)["control-class"],
            "action-method": "",
            "action-parameter": ""
        }
        switch (oStep.actionType) {
            case 'input':
                oParameters["action-method"] = "enterText";
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                oParameters["action-parameter"] = `"${sText}"`;
                this._actions.push(oParameters);
                break;
            case 'clicked':
                oParameters["action-method"] = "press";
                this._actions.push(oParameters);
                break;
            case 'validate':
                this._validations.push(oParameters);
                break;
        }

    }

    private _addControlImport(oStep: Record<string, unknown>): void {
        const sImport = this._replacePlaceholders(TSControlImport, this._getControlClassAndPath(oStep));
        if (!this._control_imports.includes(sImport)) {
            this._control_imports.push(sImport);
        }
    }

    private _getControlClassAndPath(oStep: Record<string, unknown>): { "control-class": string, "control-lib-path": string } {
        const sType = (oStep["control"] as StepControl).type;
        return {
            "control-class": sType.slice(sType.lastIndexOf(".") + 1),
            "control-lib-path": sType.replaceAll(".", "/")
        }
    }

}