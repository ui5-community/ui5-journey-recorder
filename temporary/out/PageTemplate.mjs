import RootTemplate from './RootTemplate.mjs';
const JSPageTemplate = "" +
    ``;
const TSMethodTemplate = "\n\n" +
    `   {{method-name}}(oSelector) {
        this.waitFor(Object.assign({ {{action-type}}
            viewName,
            success: () => {
                Opa5.assert.ok(true, "{{message-success}}");
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
export default class PageTemplate extends RootTemplate {
    _view_path = "";
    _actions = [];
    _assertions = [];
    _action_imports = [];
    constructor(sViewName) {
        super();
        this._view_path = sViewName;
    }
    addMethod(oStep) {
        this._addActionImport(oStep);
        this._addMethodImplementation(oStep);
    }
    generate(bTS = false) {
        let sGeneratedText = TSPageTemplate.replace("{{view-name}}", this._view_path)
            .replace("{{page-name}}", this._view_path.substring(this._view_path.lastIndexOf(".") + 1) + 'Page');
        if (this._action_imports.length > 0) {
            this._action_imports.forEach(sImport => {
                sGeneratedText = sGeneratedText.replace("{{action-import}}", `\n${sImport}{{action-import}}`);
            });
            sGeneratedText = sGeneratedText.replace("{{action-import}}", "");
        }
        else {
            sGeneratedText = sGeneratedText.replace("{{action-import}}", "");
        }
        if (this._actions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{actions-comment}}", "// Actions {{method-placeholder}}");
            this._actions.forEach(sText => {
                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sText);
            });
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "");
        }
        else {
            sGeneratedText = sGeneratedText.replace("{{actions-comment}}", "");
        }
        if (this._assertions.length > 0) {
            sGeneratedText = sGeneratedText.replace("{{assertions-comment}}", "// Assertions-comment {{method-placeholder}}");
            this._assertions.forEach(sText => {
                sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", sText);
            });
            sGeneratedText = sGeneratedText.replace("{{method-placeholder}}", "");
        }
        else {
            sGeneratedText = sGeneratedText.replace("{{assertions-comment}}", "");
        }
        return sGeneratedText;
    }
    _addMethodImplementation(oStep) {
        const sMethodName = this._genMethodNameForStep(oStep);
        const sActionClassName = this._getActionClassByStep(oStep);
        let sSuccessMessage;
        let sErrorMessage;
        const oControl = oStep.control;
        const sControlClass = oControl.type.substring(oControl.type.lastIndexOf("."));
        const sControlId = oControl.controlId.id;
        switch (oStep.actionType) {
            case "clicked":
                sSuccessMessage = `Successfull executed '${sActionClassName}' on '${sControlClass}' with id: '${sControlId}'`;
                sErrorMessage = `Failed to ${sActionClassName}, ${sControlClass} with id: '${sControlId}'`;
                break;
            case "input":
                const sText = oStep.keys.reduce((sAgg, oKey) => `${sAgg}${oKey.key}`, "");
                sSuccessMessage = `Successfull executed entered into '${sControlClass}' with id: '${sControlId}' and Text: '${sText}'`;
                sErrorMessage = `Failed to enter ${sText} into ${sControlClass} with id: '${sControlId}'`;
                break;
            case 'validate':
                sSuccessMessage = `Found ${sControlClass} with id: '${sControlId}'`;
                sErrorMessage = `Failed to find ${sControlClass} with id: '${sControlId}'`;
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
                sMethod = sMethod.replace("{{action-type}}", `\n\t\t\tactions: new ${sActionClassName}(),`);
            }
            else {
                sMethod = sMethod.replace("{{action-type}}", `\n`);
            }
            this._actions.push(sMethod);
        }
        else {
            this._assertions.push(TSMethodTemplate
                .replace("{{action-type}}", "\n")
                .replace("{{method-name}}", sMethodName)
                .replace("{{message-error}}", sErrorMessage)
                .replace("{{message-success}}", sSuccessMessage));
        }
    }
    _addActionImport(oStep) {
        const sActionClass = this._getActionClassByStep(oStep);
        if (sActionClass !== "" && !this._action_imports.find(sImport => sImport.indexOf(sActionClass) > -1)) {
            this._action_imports.push(`import ${sActionClass} from "sap/ui/test/actions/${sActionClass};`);
        }
    }
    _getActionClassByStep(oStep) {
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
