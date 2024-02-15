import { InputStep, Step } from "../../Step.class";
import StringBuilder from "../../StringBuilder.class";

export default class OPA5SingleStepStrategy {
    public static sanatize(s: unknown): string {
        if (typeof s === 'undefined') {
            return '';
        } else if (typeof s === 'string') {
            return `"${s}"`.trim();
        } else {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
            return `${s}`;
        }
    }
    public static generateSinglePressStep(step: Step): string {
        const click = new StringBuilder('oOpa5.waitFor({').addNewLine();

        if (!step.control.controlId.id.startsWith('__')) {
            click.addTab(1).add(`id: "${step.control.controlId.id}",`).addNewLine();
        }

        click.addTab(1).add(`controlType: "${step.control.type}",`).addNewLine();
        click.addTab(1).add(`visible: true,`).addNewLine();
        if (
            step.control.controlId.id.startsWith('__') &&
            (step.control.properties.filter((att) => att.use).length !== 0 ||
                step.controlBindings.filter((att) => att.use).length !== 0 ||
                step.controlI18nTexts.filter((att) => att.use).length !== 0)
        ) {
            click.addTab(1).add('matchers: [').addNewLine();
            step.control.properties
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
            step.controlBindings
                .filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new BindingPath({propertyPath: "${b.propertyPath}", path: "${b.modelPath}", model:`
                        )
                        .add(b.modelName ? `"${b.modelName}"` : `${b.modelName}`)
                        .add('})')
                        .add(',')
                        .addNewLine();
                });
            step.controlI18nTexts
                .filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new I18NText({key: "${b.propertyPath}", propertyName: "${b.propertyName}"})`
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
            .add(`errorMessage: "Can not select "${step.control.type}".`)
            .addNewLine();
        click.add('});');
        return click.toString();
    }

    public static generateSingleEnterTextStep(step: InputStep): string {
        const click = new StringBuilder('oOpa5.waitFor({').addNewLine();

        if (!step.control.controlId.id.startsWith('__')) {
            click.addTab(1).add(`id: "${step.control.controlId.id}",`).addNewLine();
        }

        click.addTab(1).add(`controlType: "${step.control.type}",`).addNewLine();
        click.addTab(1).add(`visible: true,`).addNewLine();
        if (
            step.control.controlId.id.startsWith('__') &&
            (step.control.properties.filter((att) => att.use).length !== 0 ||
                step.controlBindings.filter((att) => att.use).length !== 0 ||
                step.controlI18nTexts.filter((att) => att.use).length !== 0)
        ) {
            click.addTab(1).add('matchers: [').addNewLine();
            step.control.properties
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
            step.controlBindings
                .filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new BindingPath({propertyPath: "${b.propertyPath}", path: "${b.modelPath}", model:`
                        )
                        .add(b.modelName ? `"${b.modelName}"` : `${b.modelName}`)
                        .add('})')
                        .add(',')
                        .addNewLine();
                });
            step.controlI18nTexts
                .filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new I18NText({key: "${b.propertyPath}", propertyName: "${b.propertyName}"})`
                        )
                        .add(',')
                        .addNewLine();
                });
            click.remove(2).addNewLine();
            click.addTab(1).add('],').addNewLine();
        }

        click
            .addTab(1)
            .add(`actions: new EnterText({ text: "${step.getResultText()}" }),`)
            .addNewLine();
        click.addTab(1).add(`success: function(oControl) {`).addNewLine();
        click.addTab(2).add('console.log("Yay!");').addNewLine();
        click.addTab(1).add('},').addNewLine();
        click
            .addTab(1)
            .add(`errorMessage: "Can not enter text into "${step.control.type}".`)
            .addNewLine();
        click.add('});');
        return click.toString();
    }

    public static generateSingleValidateStep(step: Step): string {
        const click = new StringBuilder('oOpa5.waitFor({').addNewLine();

        if (!step.control.controlId.id.startsWith('__')) {
            click.addTab(1).add(`id: "${step.control.controlId.id}",`).addNewLine();
        }

        click.addTab(1).add(`controlType: "${step.control.type}",`).addNewLine();
        click.addTab(1).add(`visible: true,`).addNewLine();
        if (
            step.control.controlId.id.startsWith('__') &&
            (step.control.properties.filter((att) => att.use).length !== 0 ||
                step.controlBindings.filter((att) => att.use).length !== 0 ||
                step.controlI18nTexts.filter((att) => att.use).length !== 0)
        ) {
            click.addTab(1).add('matchers: [').addNewLine();
            step.control.properties
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
            step.controlBindings
                .filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new BindingPath({propertyPath: "${b.propertyPath}", path: "${b.modelPath}", model:`
                        )
                        .add(b.modelName ? `"${b.modelName}"` : `${b.modelName}`)
                        .add('})')
                        .add(',')
                        .addNewLine();
                });
            step.controlI18nTexts
                .filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new I18NText({key: "${b.propertyPath}", propertyName: "${b.propertyName}"})`
                        )
                        .add(',')
                        .addNewLine();
                });
            click.remove(2).addNewLine();
            click.addTab(1).add('],').addNewLine();
        }
        click.addTab(1).add(`success: function() {`).addNewLine();
        click.addTab(2).add('Opa5.assert.ok(true, "Found the control at the view");').addNewLine();
        click.addTab(1).add('},').addNewLine();
        click
            .addTab(1)
            .add(`errorMessage: "Won't be able to find field at the view with requirements: " + JSON.stringify(oMatchProperties).`)
            .addNewLine();
        click.add('});');
        return click.toString();
    }
}