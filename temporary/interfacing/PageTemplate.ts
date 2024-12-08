const RootTemplate = require('./RootTemplate');

const JSPageTemplate = "" +
    ``;

const TSMethodTemplate = "\n\n" +
    `   {{method-name}}(oSelector) {
        this.waitFor(Object.assign({ {{action-type}},
            viewName,
            success: () => {
                Opa5.assert.ok(true, {{message-success}});
            },
            errorMessage: "{{message-error}}",
        }, oSelector));
    }{{method-placeholder}}`; //method-placeholder should be something like additional-action, additional-assertion

const TSPageTemplate = "" +
    `import Opa5 from "sap/ui/test/Opa5";{{action-import}}

const viewName = "{{view-name}}";

export default class {{page-name}} extends Opa5 {
	{{actions-comment}}
	{{assertions-comment}}
}`;

module.exports = class PageTemplate extends RootTemplate {
    private _view_path: string = "";
    private _actions: string[] = [];
    private _assertions: string[] = [];
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
        let sGeneratedText = TSPageTemplate.replace("{{view-name}}", this._view_path)
            .replace("{{page-name}}", this._view_path.substring(this._view_path.indexOf(".")));

        if (this._actions) {
            sGeneratedText = sGeneratedText.replace("{{actions-comment}}", "// Actions {{method-placeholder}}");
            this._actions.forEach(sText => {
                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sText);
            })
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "");
        } else {
            sGeneratedText = sGeneratedText.replace("{{actions-comment}}", "");
        }

        if (this._assertions) {
            sGeneratedText = sGeneratedText.replace("{{assertions-comment}}", "// Assertions-comment {{method-placeholder}}");
            this._assertions.forEach(sText => {
                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sText);
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
        let sSuccessMessage: string;
        let sErrorMessage: string;
        const oControl = oStep.control as Record<string, unknown>;
        const sControlClass = (oControl.type as string).substring((oControl.type as string).lastIndexOf("."));
        const sControlId = (oControl.controlId as Record<string, unknown>).id as string;
        switch (oStep.actionType) {
            case "clicked":
                sSuccessMessage = `Successfull executed '${sActionClassName}' on '${sControlClass}' with id: '${sControlId}'`;
                sErrorMessage = `Failed to ${sActionClassName}, ${sControlClass} with id: '${sControlId}'`;
                break;
            case "input":
                const sText = (oStep.keys as Record<string, unknown>[]).reduce((sAgg: string, oKey: Record<string, unknown>) => `${sAgg}${oKey.key}`, "");
                sSuccessMessage = `Successfull executed entered into '${sControlClass}' with id: '${sControlId}' and Text: '${sText}'`;
                sErrorMessage = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                break;
            case 'validate':
                sSuccessMessage = `Found ${sControlClass} with id: '${sControlId}'`;
                sErrorMessage = `Failed to find ${sControlClass} with id: '${sControlId}'`
                break;
            default:
                sSuccessMessage = "";
                sErrorMessage = "";
        }
        if (oStep.actionType === 'clicked' || oStep.actionType === 'input') {
            let sMethod = TSMethodTemplate
                .replace("{{method-name}}", sMethodName)
                .replace("{{message-error}}", sErrorMessage)
                .replace("{{message-success}}", sSuccessMessage);

            if (sActionClassName !== "") {
                sMethod = sMethod.replace("{{action-type}}", `\nactions: new ${sActionClassName}(),`);
            } else {
                sMethod = sMethod.replace("{{action-type}}", `\n`);
            }
            this._actions.push(sMethod);
        } else {
            this._assertions.push(TSMethodTemplate
                .replace("{{action-type}}", "\n")
                .replace("{{method-name}}", sMethodName)
                .replace("{{message-error}}", sErrorMessage)
                .replace("{{message-success}}", sSuccessMessage));

        }
    }

    private _addActionImport(oStep: Record<string, unknown>) {
        const sActionClass = this._getActionClassByStep(oStep);
        if (sActionClass !== "") {
            this._action_imports.push(`import ${sActionClass} from "sap/ui/test/actions/${sActionClass};`);
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