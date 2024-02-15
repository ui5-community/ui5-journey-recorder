import { InputStep, Step, StepType } from "../../Step.class";
import OPA5SingleStepStrategy from "./OPA5SingleStepStrategy.class";

export default class OPA5CodeStrategy {
    public static generateStepCode(step: Step): string {
        switch (step.actionType) {
            case StepType.CLICK:
                return OPA5SingleStepStrategy.generateSinglePressStep(step);
            case StepType.VALIDATION:
                return OPA5SingleStepStrategy.generateSingleValidateStep(step);
            case StepType.INPUT:
                return OPA5SingleStepStrategy.generateSingleEnterTextStep(
                    step as InputStep
                );
            default:
                return 'Unknown StepType';
        }
    }
}