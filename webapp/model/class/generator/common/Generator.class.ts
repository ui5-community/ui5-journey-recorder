import { StepType } from "../../../enum/StepType";
import { InputStep, Step } from "../../Step.class";

export default abstract class Generator {
    abstract generate(bTS: boolean): string;

    _genMethodNameForStep(step: Step): string {
        const sClass = this._capitalizeFirstLetter(step.control.type.slice(step.control.type.lastIndexOf('.') + 1));

        switch (step.actionType) {
            case StepType.INPUT:
                return `iType_${(step as InputStep).getResultText()}_IntoThe${sClass}`;
            case StepType.CLICK:
                return `iPressThe${sClass}`;
            case StepType.VALIDATION:
                return `iShouldSeeThe${sClass}`;
            default:
                return 'xxx';
        }
    }

    _replacePlaceholders(template: string, placeholders: Record<string, string>): string {
        return Object.keys(placeholders).reduce(
            (updatedTemplate, key) => updatedTemplate.replaceAll(`{{${key}}}`, placeholders[key]),
            template
        );
    }

    private _capitalizeFirstLetter(sString: string): string {
        return String(sString).charAt(0).toUpperCase() + String(sString).slice(1);
    }
}