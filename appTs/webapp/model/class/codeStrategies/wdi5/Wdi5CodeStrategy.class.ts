import { InputStep, Step, StepType } from "../../Step.class";
import Wdi5SingleStepStrategy from "./Wdi5SingleStepStrategy.class";

export default class Wdi5CodeStrategy {
    public static generateStepCode(step: Step): string {
        switch (step.actionType) {
            case StepType.CLICK:
                return Wdi5SingleStepStrategy.generateSinglePressStep(step);
            case StepType.VALIDATION:
                return Wdi5SingleStepStrategy.generateSingleExistsStep(step);
            case StepType.INPUT:
                return Wdi5SingleStepStrategy.generateSingleInputStep(step as InputStep);
            default:
                return 'Unknown StepType';
        }
    }
}