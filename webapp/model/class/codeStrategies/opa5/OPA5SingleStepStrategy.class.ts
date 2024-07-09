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
            step.control?.properties?.filter((att) => att.use)
                .forEach((att) => {
                    click
                        .addTab(2)
                        .add(
                            `new Properties(${this._createAttributeValue(att)})`
                        )
                        .add(',')
                        .addNewLine();
                });

            step.control?.bindings?.filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new BindingPath(${this._createBindingValue(b)})`
                        )
                        .add(',')
                        .addNewLine();
                });

            step.control?.i18nTexts?.filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new I18NText(${this._createI18nValue(b)})`
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
            .add(`errorMessage: "Can not select '${step.control.type}'"`)
            .addNewLine();
        click.add('});');
        return click.toString();
    }

    public static generateSingleEnterTextStep(step: InputStep): string {
        const enterText = new StringBuilder('oOpa5.waitFor({').addNewLine();

        if (step?.control?.controlId?.use) {
            enterText.addTab(1).add(`id: "${step.control.controlId.id}",`).addNewLine();
        }

        enterText.addTab(1).add(`controlType: "${step.control.type}",`).addNewLine();
        enterText.addTab(1).add(`visible: true,`).addNewLine();
        if (
            !step?.control?.controlId?.use &&
            (step.control.properties.filter((att) => att.use).length !== 0 ||
                step.controlBindings.filter((att) => att.use).length !== 0 ||
                step.controlI18nTexts.filter((att) => att.use).length !== 0)
        ) {
            enterText.addTab(1).add('matchers: [').addNewLine();
            step.control?.properties?.filter((att) => att.use)
                .forEach((att) => {
                    click
                        .addTab(2)
                        .add(
                            `new Properties(${this._createAttributeValue(att)})`
                        )
                        .add(',')
                        .addNewLine();
                });

            step.control?.bindings?.filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new BindingPath(${this._createBindingValue(b)})`
                        )
                        .add(',')
                        .addNewLine();
                });

            step.control?.i18nTexts?.filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new I18NText(${this._createI18nValue(b)})`
                        )
                        .add(',')
                        .addNewLine();
                });
            enterText.remove(2).addNewLine();
            enterText.addTab(1).add('],').addNewLine();
        }

        enterText
            .addTab(1)
            .add(`actions: new EnterText({ text: "${step.getResultText()}" }),`)
            .addNewLine();
        enterText.addTab(1).add(`success: function(oControl) {`).addNewLine();
        enterText.addTab(2).add('console.log("Yay!");').addNewLine();
        enterText.addTab(1).add('},').addNewLine();
        enterText
            .addTab(1)
            .add(`errorMessage: "Can not enter text into '${step.control.type}'"`)
            .addNewLine();
        enterText.add('});');
        return enterText.toString();
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
            step.control?.properties?.filter((att) => att.use)
                .forEach((att) => {
                    click
                        .addTab(2)
                        .add(
                            `new Properties(${this._createAttributeValue(att)})`
                        )
                        .add(',')
                        .addNewLine();
                });

            step.control?.bindings?.filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new BindingPath(${this._createBindingValue(b)})`
                        )
                        .add(',')
                        .addNewLine();
                });

            step.control?.i18nTexts?.filter((b) => b.use)
                .forEach((b) => {
                    click
                        .addTab(2)
                        .add(
                            `new I18NText(${this._createI18nValue(b)})`
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
            .add(`errorMessage: "Won't be able to find field at the view with requirements: " + JSON.stringify(oMatchProperties)`)
            .addNewLine();
        click.add('});');
        return click.toString();
    }

    private static _createAttributeValue(e: {
        name: string;
        value: unknown;
        use: boolean;
    }): string {
        let value: boolean | number | string;

        if (typeof value === 'boolean') {
            value = Boolean(value);
        } else if (typeof value === 'number') {
            value = Number(value);
        } else {
            value = this._sanatize(e.value);
        }

        return '{' + e.name + ': ' + value + '}';
    }

    private static _createBindingValue(e: {
        propertyName?: string;
        bindingValue?: string | number | boolean;
        modelPath?: string;
        propertyPath?: string;
        modelName: string;
        contextPath?: string;
        use: boolean;
    }): string {
        const sbBV = new StringBuilder('{');
        sbBV.add(`modelName: "${e.modelName}"`);
        if(e.propertyPath) {
            sbBV.add(", ").add(`propertyPath: "${e.propertyPath}"`);
        }
        if(e.modelPath) {
            sbBV.add(", ").add(`path: "${e.modelPath}"`);
        }
        if(e.contextPath) {
            sbBV.add(", ").add(`contextPath: "${e.contextPath}"`);
        }
        sbBV.add('}');
        return sbBV.toString();
    }

    private static _createI18nValue(e: {
        propertyName: string;
        propertyPath: string;
        bindingValue: unknown;
        use: boolean;
    }): string {
        return `{key: "${e.propertyPath}", propertyName: "${e.propertyName}"}`;
    }

    private static _sanatize(s: unknown): string {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
        return `"${s}"`.trim();
    }
}