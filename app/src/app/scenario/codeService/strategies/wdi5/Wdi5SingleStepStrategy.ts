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
    Object.values(step.recordReplaySelector).forEach((v) => {
      selectorBuilder.addTab(2).add(`${v[0]}: ${v[1]}`).add(',').addNewLine();
    });
    selectorBuilder.remove(2).addNewLine();
    return selectorBuilder;
  }
}
