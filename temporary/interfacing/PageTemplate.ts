import { JSMethodTemplate, JSPageTemplate, TSMethodTemplate, TSPageTemplate } from './Templates';
import RootTemplate from './RootTemplate';

type MethodParameters = { method_name: string, success_message: string, error_message: string, action_type: string };

export default class PageTemplate extends RootTemplate {
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
        // refactoring
        // return bTS ? this._generateTemplate({ pageTemplate: TSPageTemplate, methodTemplate: TSMethodTemplate }) : this._generateTemplate({ pageTemplate: JSPageTemplate, methodTemplate: JSMethodTemplate });
        return bTS ? this._generateTS() : this._generateJS();
    }
    //#region refactoring
    private _generateTemplate(templates: { pageTemplate: string, methodTemplate: string }): string {
        const placeholders = {
            "view-name": this._view_path,
            "page-name": this._view_path.substring(this._view_path.lastIndexOf(".") + 1),
            "action-import": this._action_imports.map(cls => `, "sap/ui/test/actions/${cls}"`).join(""),
            "action-class": this._action_imports.join(", "),
        };

        let sGeneratedText = this._replacePlaceholders(templates.pageTemplate, placeholders);

        if (this._actions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", this._generateMethods(this._actions, templates.methodTemplate));
        } else {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", "");
        }

        if (this._assertions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", this._generateMethods(this._assertions, templates.methodTemplate));
        } else {
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", "");
        }

        return sGeneratedText;
    }

    private _generateMethods(methods: Record<string, string>[], template: string): string {
        return methods
            .map(method => this._replacePlaceholders(template, method))
            .join("\n");
    }

    private _replacePlaceholders(template: string, placeholders: Record<string, string>): string {
        return Object.keys(placeholders).reduce(
            (updatedTemplate, key) => updatedTemplate.replace(new RegExp(`{{${key}}}`, "g"), placeholders[key]),
            template
        );
    }
    //#endregion refactoring

    private _generateJS(): string {
        let sGeneratedText = JSPageTemplate.replace("{{view-name}}", this._view_path)
            .replace("{{page-name}}", this._view_path.substring(this._view_path.lastIndexOf(".") + 1));

        if (this._action_imports.length > 0) {
            this._action_imports.forEach(sActionClass => {
                sGeneratedText = sGeneratedText.replace("{{action-import}}", `,\n\t"sap/ui/test/actions/${sActionClass}"{{action-import}}`);
                sGeneratedText = sGeneratedText.replace("{{action-class}}", `, ${sActionClass}{{action-class}}`);
            });
            sGeneratedText = sGeneratedText.replace("{{action-import}}", "");
            sGeneratedText = sGeneratedText.replace("{{action-class}}", "");
        } else {
            sGeneratedText = sGeneratedText.replace("{{action-import}}", "");
            sGeneratedText = sGeneratedText.replace("{{action-class}}", "");
        }

        if (this._actions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", "\n\t\t\tactions: { {{method-placeholder}}");
            this._actions.forEach(oAction => {
                let sActionImpl = JSMethodTemplate
                    .replace("{{method-name}}", oAction.method_name)
                    .replace("{{message-success}}", oAction.success_message)
                    .replace("{{message-error}}", oAction.error_message);

                if (oAction.action_type === "") {
                    sActionImpl = sActionImpl.replace("{{action-type}}", oAction.action_type);
                } else {
                    sActionImpl = sActionImpl.replace("{{action-type}}", `\n\t\t\t\t\t\tactions: new ${oAction.action_type}(),`)
                }

                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sActionImpl);
            })
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "\n\t\t\t}");
        } else {
            sGeneratedText = sGeneratedText.replace("{{actions-ref}}", "");
        }

        if (this._assertions.length > 0) {
            if (this._actions.length > 0) {
                sGeneratedText = sGeneratedText.replace("{{assert-ref}}", ",{{assert-ref}}");
            }
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", "\n\t\t\tassertions: { {{method-placeholder}}");
            this._assertions.forEach(oAssert => {
                let sAssertionImpl = JSMethodTemplate
                    .replace("{{method-name}}", oAssert.method_name)
                    .replace("{{message-success}}", oAssert.success_message)
                    .replace("{{message-error}}", oAssert.error_message);

                if (oAssert.action_type === "") {
                    sAssertionImpl = sAssertionImpl.replace("{{action-type}}", oAssert.action_type);
                } else {
                    sAssertionImpl = sAssertionImpl.replace("{{action-type}}", `\n\t\t\t\t\t\tactions: new ${oAssert.action_type}(),`)
                }

                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sAssertionImpl);
            })
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "\n\t\t\t}");
        } else {
            sGeneratedText = sGeneratedText.replace("{{assert-ref}}", "");
        }

        return sGeneratedText;
    }

    private _generateTS(): string {
        let sGeneratedText = TSPageTemplate.replace("{{view-name}}", this._view_path)
            .replace("{{page-name}}", this._view_path.substring(this._view_path.lastIndexOf(".") + 1));

        if (this._action_imports.length > 0) {
            this._action_imports.forEach(sActionClass => {
                sGeneratedText = sGeneratedText.replace("{{action-import}}", `\nimport ${sActionClass} from "sap/ui/test/actions/${sActionClass}";{{action-import}}`);
            });
            sGeneratedText = sGeneratedText.replace("{{action-import}}", "");
        } else {
            sGeneratedText = sGeneratedText.replace("{{action-import}}", "");
        }

        if (this._actions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{actions-comment}}", "// Actions {{method-placeholder}}");
            this._actions.forEach(oAction => {
                let sActionImpl = TSMethodTemplate
                    .replace("{{method-name}}", oAction.method_name)
                    .replace("{{message-success}}", oAction.success_message)
                    .replace("{{message-error}}", oAction.error_message);

                if (oAction.action_type === "") {
                    sActionImpl = sActionImpl.replace("{{action-type}}", oAction.action_type);
                } else {
                    sActionImpl = sActionImpl.replace("{{action-type}}", `\n\t\t\tactions: new ${oAction.action_type}(),`)
                }

                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sActionImpl);
            })
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "");
        } else {
            sGeneratedText = sGeneratedText.replace("{{actions-comment}}", "");
        }

        if (this._assertions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{assertions-comment}}", "// Assertions-comment {{method-placeholder}}");
            this._assertions.forEach(oAssert => {
                let sAssertionImpl = TSMethodTemplate
                    .replace("{{method-name}}", oAssert.method_name)
                    .replace("{{message-success}}", oAssert.success_message)
                    .replace("{{message-error}}", oAssert.error_message);

                if (oAssert.action_type === "") {
                    sAssertionImpl = sAssertionImpl.replace("{{action-type}}", oAssert.action_type);
                } else {
                    sAssertionImpl = sAssertionImpl.replace("{{action-type}}", `\n\t\t\tactions: new ${oAssert.action_type}(),`)
                }

                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sAssertionImpl);
            })
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "");
        } else {
            sGeneratedText = sGeneratedText.replace("{{assertions-comment}}", "");
        }

        return sGeneratedText;
    }

    private _addMethodImplementation(oStep: Record<string, unknown>) {
        const sMethodName = this._genMethodNameForStep(oStep);
        const sActionClassName = this._getActionClassByStep(oStep);
        const oControl = oStep.control as Record<string, unknown>;
        const sControlClass = (oControl.type as string).substring((oControl.type as string).lastIndexOf(".") + 1);
        const sControlId = (oControl.controlId as Record<string, unknown>).id as string;

        const oMethodParameter = {
            method_name: sMethodName,
            success_message: "",
            error_message: "",
            action_type: sActionClassName
        }

        switch (oStep.actionType) {
            case "clicked":
                oMethodParameter.success_message = `Successfull executed '${sActionClassName}' on '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter.error_message = `Failed to ${sActionClassName}, ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case "input":
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                oMethodParameter.success_message = `Successfull executed entered text '${sText}' into '${sControlClass}' with id: '${sControlId}'`;
                oMethodParameter.error_message = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                this._actions.push(oMethodParameter);
                break;
            case 'validate':
                oMethodParameter.success_message = `Found ${sControlClass} with id: '${sControlId}'`;
                oMethodParameter.error_message = `Failed to find ${sControlClass} with id: '${sControlId}'`
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