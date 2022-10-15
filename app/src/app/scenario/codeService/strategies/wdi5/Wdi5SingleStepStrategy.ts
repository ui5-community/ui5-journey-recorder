import { type } from 'os';
import { exit } from 'process';
import { Step } from 'src/app/classes/Step';
import StringBuilder from 'src/app/classes/StringBuilder';

export default class Wdi5SingleStepStrategy {
  public static generateSinglePressStep(step: Step): string {
    const pressStep = new StringBuilder();
    pressStep.add(Wdi5SingleStepStrategy.generateSingleExistsStep(step));
    pressStep.add('.press();');
    return pressStep.toString();
  }

  public static generateSingleInputStep(step: Step): string {
    const pressStep = new StringBuilder();
    pressStep.add(Wdi5SingleStepStrategy.generateSingleExistsStep(step));
    pressStep.add(`.enterText("FIXME");`); // FIXME: add actual step input value
    return pressStep.toString();
  }

  public static generateSingleExistsStep(step: Step): string {
    const exists = new StringBuilder();
    exists.add('await browser.asControl({').addNewLine();
    exists.addTab().add('selector: {').addNewLine();
    exists.addBuilder(Wdi5SingleStepStrategy.generateSelector(step));
    exists.addTab().add('}').addNewLine();
    exists.add('})');
    return exists.toString();
  }

  private static generateSelector(step: Step): StringBuilder {
    const selectorBuilder = new StringBuilder();
    /**
     * traverse a json object and pretty-js-code format it as a string
     * @param entry key-value pair that might either be string:string or string:object
     */
    let indent = 2; 
    const traverse = (entry: [any, any]) => {
      if (typeof entry[1] === 'string') {
        selectorBuilder
          .addTab(indent)
          .add(`${entry[0]}: "${entry[1].replace('\\','')}"`)
          .add(',')
          .addNewLine();
      } else {
        selectorBuilder.addTab(indent).add(`${entry[0]}: {`).addNewLine()
        for (const deepEntry of Object.entries(entry[1])) {
          ++indent;
          traverse(deepEntry);
          --indent;
        }
        selectorBuilder.addTab(indent).add("}").addNewLine()
      }
    };

    // format the json-style record replay seclector as pretty looking js code
    for (const entry of Object.entries(step.recordReplaySelector)) {
      traverse(entry);
    }
    return selectorBuilder;
  }
}
