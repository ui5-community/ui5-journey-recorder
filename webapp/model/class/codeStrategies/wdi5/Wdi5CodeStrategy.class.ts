import { StepType } from "../../../enum/StepType";
import Journey from "../../Journey.class";
import { InputStep, Step } from "../../Step.class";
import { CodePage } from "../CodePage.type";
import Wdi5PageBuilder from "./Wdi5PageBuilder.class";
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

    generateJourneyCode(journey: Journey): CodePage[] {
        const codes: CodePage[] = [];
        const pages: Record<string, Wdi5PageBuilder> = {};

        // we treat each "page" as part of the entire journey and slice it up accordingly
        journey.steps.forEach((step: Step) => {
            if (!pages[step.viewInfos.relativeViewName]) {
                pages[step.viewInfos.relativeViewName] = new Wdi5PageBuilder(step.viewInfos.relativeViewName, `#/${step.viewInfos.relativeViewName}`);
            }
            (pages[step.viewInfos.relativeViewName]).addStep(step);
        });

        Object.entries(pages).forEach((entry: [string, Wdi5PageBuilder]) => {
            codes.push({
                title: `Part ${entry[0]} of Journey`,
                code: entry[1].generate(),
                type: 'journey'
            });
        })
        return codes;
    }

    // no difference in wdi5 btw a step in a page or a standalone step
    generatePagedStepCode(step: Step): string {
        return Wdi5CodeStrategy.generateStepCode(step);
    }
}