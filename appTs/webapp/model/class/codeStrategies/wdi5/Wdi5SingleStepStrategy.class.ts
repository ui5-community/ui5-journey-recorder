import { InputStep, Step } from "../../Step.class";
import StringBuilder from "../../StringBuilder.class";

export default class Wdi5SingleStepStrategy {
    public static generateSinglePressStep(
        step: Step,
        indent: number = 2
    ): string {
        const pressStep = new StringBuilder();
        pressStep.add(
            Wdi5SingleStepStrategy.generateSingleExistsStep(step, indent)
        );
        pressStep.add('.press();');
        return pressStep.toString();
    }

    public static generateSingleInputStep(
        step: InputStep,
        indent: number = 2
    ): string {
        const pressStep = new StringBuilder();
        pressStep.add(
            Wdi5SingleStepStrategy.generateSingleExistsStep(step, indent)
        );
        pressStep.add(`.enterText("${step.getResultText()}");`); // FIXME: add actual step input value
        return pressStep.toString();
    }

    public static generateSingleExistsStep(
        step: Step,
        indent: number = 2
    ): string {
        const exists = new StringBuilder();

        indent > 0 ? exists.addTab(indent) : null;
        exists.add('await browser.asControl({').addNewLine();

        exists
            .addTab(indent + 1)
            .add('selector: {')
            .addNewLine();

        exists.addBuilder(
            Wdi5SingleStepStrategy.generateSelector(step, indent + 2)
        );

        exists
            .addTab(indent + 1)
            .add('}')
            .addNewLine();

        indent > 0 ? exists.addTab(indent) : null;
        exists.add('})');

        return exists.toString();
    }

    private static generateSelector(
        step: Step,
        indent: number = 2
    ): StringBuilder {
        const selectorBuilder = new StringBuilder();

        //Take the preformatted JSON string and apply the code-generator style to it
        const array = JSON.stringify(step.recordReplaySelector, null, 4).split('\n');
        array.pop(); // remove the last brace
        array.shift(); // remove the first brace

        const content = array.map(item => {
            const sb = new StringBuilder();
            sb.addTab(indent - 1);
            sb.add(item);
            sb.addNewLine();
            return sb.toString();
        }).reduce((a, b) => a + b, '');
        selectorBuilder.add(content);

        return selectorBuilder;
    }
}