import AbstractPageGenerator from './AbstractPageGenerator';
import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from './wdi5Templates';

type StepControl = {
    controlId: {
        id: string,
        use: boolean
    },
    type: string,
    properties: { name: string, value: unknown, use: boolean }[]
}

type MethodReplacements = {
    "method-name": string,
    "step-selector": string,
    "control-class": string,
    "action-method": string,
    "action-parameter": string
}

export default class wdi5PageGenerator extends AbstractPageGenerator {
    private _control_imports: string[] = [];
    private _actions: MethodReplacements[] = [];
    private _validations: MethodReplacements[] = [];
    private _view_path: string = "";
    private _view_hash: string = "";
    constructor(sViewName: string, sPageHash: string) {
        super();
        this._view_path = sViewName;
        this._view_hash = sPageHash;
    }

    generate(bTS: boolean): string {
        const sTemplate = bTS ? TSPageTemplate : JSPageTemplate;
        const oMethodTemplates = bTS ? {
            actionMethod: TSActionMethodTemplate,
            assertMethod: TSAssertionMethodTemplate
        } : {
            actionMethod: JSActionMethodTemplate,
            assertMethod: JSAssertionMethodTemplate
        };

        const oReplacements = {
            "control-imports": this._control_imports.length > 0 ? "\n" + this._control_imports.join("\n") + "\n" : "",
            "page-name": this._view_path.slice(this._view_path.lastIndexOf(".") + 1),
            "page-path": this._view_path,
            "page-hash": this._view_hash.slice(this._view_hash.lastIndexOf("#")),
            "actions-ref": this._generateActions(oMethodTemplates.actionMethod, bTS),
            "assert-ref": this._generateValidations(oMethodTemplates.assertMethod, bTS),
        }

        return this._replacePlaceholders(sTemplate, oReplacements);
    }

    addMethod(oStep: Record<string, unknown>): void {
        this._addControlImport(oStep);
        this._addMethodImplementation(oStep);
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
        const oParameters: MethodReplacements = {
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