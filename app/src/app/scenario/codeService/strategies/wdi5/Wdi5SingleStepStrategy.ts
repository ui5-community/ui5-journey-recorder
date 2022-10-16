import { Step } from 'src/app/classes/Step';
import StringBuilder from 'src/app/classes/StringBuilder';

export default class Wdi5SingleStepStrategy {
  public static generateSinglePressStep(
    step: Step,
    indent: number = 0
  ): string {
    const pressStep = new StringBuilder();
    pressStep.add(
      Wdi5SingleStepStrategy.generateSingleExistsStep(step, indent)
    );
    pressStep.add('.press();');
    return pressStep.toString();
  }

  public static generateSingleInputStep(
    step: Step,
    indent: number = 0
  ): string {
    const pressStep = new StringBuilder();
    pressStep.add(
      Wdi5SingleStepStrategy.generateSingleExistsStep(step, indent)
    );
    pressStep.add(`.enterText("FIXME");`); // FIXME: add actual step input value
    return pressStep.toString();
  }

  public static generateSingleExistsStep(
    step: Step,
    indent: number = 0
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
    indent: number = 0
  ): StringBuilder {
    const selectorBuilder = new StringBuilder();
    /**
     * traverse a json object and pretty-js-code format it as a string
     * @param entry key-value pair that might either be string:string or string:object
     */
    const traverse = (entry: [any, any]) => {
      const prop = typeof entry[1];
      if (prop === 'string' || prop === 'boolean') {
        const isBool = prop === 'boolean' ? true : false;
        const propValue =
          prop === 'string' ? entry[1].replace('\\', '') : entry[1]; // neverending story of json escaping
        selectorBuilder
          .addTab(indent)
          .add(`${entry[0]}: ${isBool ? propValue : '"' + propValue + '"'}`) // insert properly formatted value
          .add(',')
          .addNewLine();
      } else {
        selectorBuilder.addTab(indent).add(`${entry[0]}: {`).addNewLine();
        for (const deepEntry of Object.entries(entry[1])) {
          ++indent;
          traverse(deepEntry);
          --indent;
        }
        selectorBuilder.addTab(indent).add('}').addNewLine();
      }
    };

    // format the json-style record replay seclector as pretty looking js code
    for (const entry of Object.entries(step.recordReplaySelector)) {
      traverse(entry);
    }
    return selectorBuilder;
  }
}
