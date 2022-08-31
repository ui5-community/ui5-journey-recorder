import StringBuilder from 'src/app/classes/StringBuilder';
import { Step } from 'src/app/classes/testScenario';

export default class OPA5SingleStepStrategy {
  public static sanatize(s: any): string {
    if (typeof s === 'undefined') {
      return '';
    } else if (typeof s === 'string') {
      return `"${s}"`.trim();
    } else {
      return `${s}`;
    }
  }

  public static generateSinglePressStep(step: Step): string {
    const click = new StringBuilder('oOpa5.waitFor({').addNewLine();

    if (!step.controlId.startsWith('__')) {
      click.addTab(1).add(`id: "${step.controlId}",`).addNewLine();
    }

    click.addTab(1).add(`controlType: "${step.controlType}",`).addNewLine();
    click.addTab(1).add(`visible: true,`).addNewLine();
    if (
      step.controlId.startsWith('__') &&
      step.controlAttributes.filter((att) => att.use).length !== 0
    ) {
      click.addTab(1).add('matchers: [').addNewLine();
      step.controlAttributes
        .filter((att) => att.use)
        .forEach((att) => {
          click
            .addTab(2)
            .add(
              `new Properties({ ${att.name}: ${OPA5SingleStepStrategy.sanatize(
                att.value
              )}})`
            )
            .add(',')
            .addNewLine();
        });
      click.remove(2).addNewLine();
      click.addTab(1).add('],').addNewLine();
    }

    click.addTab(1).add(`actions: new Press(),`).addNewLine();
    click.addTab(1).add(`success: function(oControl) {`).addNewLine();
    click.addTab(2).add('console.log("Yay!");').addNewLine();
    click.addTab(1).add('},').addNewLine();
    click
      .addTab(1)
      .add(`errorMessage: "Can not select "${step.controlType}".`)
      .addNewLine();
    click.add('});');
    return click.toString();
  }
}
