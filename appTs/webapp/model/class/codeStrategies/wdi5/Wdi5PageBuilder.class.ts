import { InputStep, Step, StepType } from "../../Step.class";
import StringBuilder from "../../StringBuilder.class";
import Wdi5SingleStepStrategy from "./Wdi5SingleStepStrategy.class";

export default class Wdi5PageBuilder {
    private _steps: Step[] = [];
    pageName: string;
    hashPath: string;

    constructor(pageName: string, hashPath: string) {
        this.pageName = pageName;
        this.hashPath = hashPath;
    }

    public addStep(step: Step) {
        this._steps.push(step);
    }

    generate(): string {
        const sb = new StringBuilder();
        sb.add(`const { wdi5 } = require("wdio-ui5-service");`).addNewLine();
        sb.add(`class ${this.pageName} {`).addNewLine();

        sb.addBuilder(this._generateOpenMethod());

        sb.addTab().add(`async journey() {`).addNewLine();
        this._generateJourneySteps().forEach((stepCode) => {
            sb.add(stepCode);
            sb.addNewLine();
        });
        sb.addTab().add(`}`).addNewLine();

        sb.add(`};`).addNewLine();
        // for easier usage at dev time:
        // require $pageobject -> use as $pageobject.method() immediately
        sb.add(`module.exports = new ${this.pageName}();`);
        return sb.toString();
    }

    private _generateJourneySteps(): string[] {
        const stepCodes = this._steps.map((step) => {
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
        });
        return stepCodes;
    }

    private _generateOpenMethod(): StringBuilder {
        const p = new StringBuilder();
        p.addTab().add(`async open() {`).addNewLine();
        p.addTab(2).add(`wdi5.goTo("${this.hashPath}")`).addNewLine();
        p.addTab().add(`}`).addNewLine();
        return p;
    }
}
