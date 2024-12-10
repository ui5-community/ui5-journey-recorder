import { JSMethodTemplate, JSPageTemplate, JSImportTemplate, TSMethodTemplate, TSPageTemplate, TSImportTemplate, ActionsTemplate } from './PageTemplates';
import AbstractGenerator from './AbstractGenerator';

type MethodParameters = { "method-name": string, "success-message": string, "error-message": string, "action-type": string, "action-create"?: string };

export default class PageTemplate extends AbstractGenerator {
    private _view_path: string = "";
    private _actions: MethodParameters[] = [];
    private _assertions: MethodParameters[] = [];
    private _action_imports: string[] = [];

    constructor(sViewName: string) {
        super();
        this._view_path = sViewName;
    }

    addMethod(oStep: Record<string, unknown>) {
        this._addActionImport(oStep);
        this._addMethodImplementation(oStep);
    }

    generate(bTS: boolean = false): string {
        let sGeneratedText = bTS ? TSPageTemplate : JSPageTemplate;
        const sMethodTemplate = bTS ? TSMethodTemplate : JSMethodTemplate;
        const sImportTemplate = bTS ? TSImportTemplate : JSImportTemplate;

        const placeholders = {
            "view-name": this._view_path,
            "page-name": this._view_path.substring(this._view_path.lastIndexOf(".") + 1),
            "action-import": (bTS ? "\n" : ",\n") + this._action_imports.map(cls => sImportTemplate.slice().replaceAll("{{action-class}}", cls)).join(bTS ? "\n" : ",\n"),
            "action-class": (this._action_imports.length > 0 ? ', ' : '') + this._action_imports.join(", ")
        }
        // create the general page setup
        sGeneratedText = this._replacePlaceholders(sGeneratedText, placeholders);

        if (this._actions.length > 0) {
            sGeneratedText = sGeneratedText.replace(
                "{{actions-ref}}",
                bTS ? this._generateMethods(this._actions, sMethodTemplate, bTS)
                    : `\n\t\t\tactions: {${this._generateMethods(this._actions, sMethodTemplate, bTS)}\n\t\t\t}`
            );
        } else {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", "");
        }

        if (this._assertions.length > 0) {
            if (!bTS && this._actions.length > 0) {
                sGeneratedText = sGeneratedText.replace("{{assert-ref}}", ",{{assert-ref}}");
            }
            sGeneratedText = sGeneratedText.replace(
                "{{assert-ref}}",
                bTS ? this._generateMethods(this._assertions, sMethodTemplate, bTS)
                    : `\n\t\t\tassertions: {${this._generateMethods(this._assertions, sMethodTemplate, bTS)}\n\t\t\t}`
            );
        } else {
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", "");
        }

        return sGeneratedText;
    }

    private _generateMethods(methods: Record<string, string>[], template: string, bTS: boolean = false): string {
        return methods
            .map(method => {
                method["action-create"] = method["action-type"] !== "" ? (bTS ? "\n" : "\n\t\t\t") + this._replacePlaceholders(ActionsTemplate, method) : "";
                return this._replacePlaceholders(template, method)
            })
            .join(`${bTS ? '' : ','}\n`);
    }

    private _addMethodImplementation(oStep: Record<string, unknown>) {
        const sMethodName = this._genMethodNameForStep(oStep);
        const sActionClassName = this._getActionClassByStep(oStep);
        const oControl = oStep.control as Record<string, unknown>;
        const sControlClass = (oControl.type as string).substring((oControl.type as string).lastIndexOf(".") + 1);
        const sControlId = (oControl.controlId as Record<string, unknown>).id as string;

        const oMethodParameter = {
            "method-name": sMethodName,
            "success-message": "",
            "error-message": "",
            "action-type": sActionClassName
        }

        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter["success-message"] = `Successfull executed '${sActionClassName}' on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to ${sActionClassName}, ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                oMethodParameter["success-message"] = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter["success-message"] = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter["error-message"] = `Failed to find ${sControlClass} with id: '${sControlId}'`
                this._assertions.push(oMethodParameter);
                break;
        }
    }

    private _addActionImport(oStep: Record<string, unknown>) {
        const sActionClass = this._getActionClassByStep(oStep);
        if (sActionClass !== "" && !this._action_imports.includes(sActionClass)) {
            this._action_imports.push(sActionClass);
        }
    }

    private _getActionClassByStep(oStep: Record<string, unknown>): string {
        switch (oStep.actionType) {
            case 'input':
                return "EnterText";
            case 'clicked':
                return "Press";
            default:
                return "";
        }
    }
}