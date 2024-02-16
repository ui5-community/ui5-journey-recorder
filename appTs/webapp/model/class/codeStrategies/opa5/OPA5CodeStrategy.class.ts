import { InputStep, Step, StepType } from "../../Step.class";
import StringBuilder from "../../StringBuilder.class";
import OPA5SingleStepStrategy from "./OPA5SingleStepStrategy.class";
import { AdderOptions, PageBuilder } from "./PageBuilder.class";

export default class OPA5CodeStrategy {
    private _pages: Record<string, PageBuilder> = {};

    public static generateStepCode(step: Step): string {
        switch (step.actionType) {
            case StepType.CLICK:
                return OPA5SingleStepStrategy.generateSinglePressStep(step);
            case StepType.VALIDATION:
                return OPA5SingleStepStrategy.generateSingleValidateStep(step);
            case StepType.INPUT:
                return OPA5SingleStepStrategy.generateSingleEnterTextStep(
                    step as InputStep
                );
            default:
                return 'Unknown StepType';
        }
    }

    public generatePagedStepCode(
        step: Step
    ): string {
        switch (step.actionType) {
            case StepType.CLICK:
                return this._createClickStep(step);
            case StepType.VALIDATION:
                return this._createValidateStep(step);
            case StepType.INPUT:
                return this._createInputStep(step as InputStep);
            default:
                return '';
        }
    }

    private _createClickStep(
        step: Step
    ): string {
        const sb = new StringBuilder();
        const viewName = step.viewInfos.relativeViewName;

        sb.addTab(2).add('When.on').add(viewName).add('.pressOn({');

        let usedMatchers: Record<string, unknown> = {};
        if (step.control.controlId.use) {
            sb.add(`id: {value: "${step.control.controlId.id}",isRegex: true}`).add(',');
            usedMatchers['press'] = true;
        }

        const elementMatcher = this._createObjectMatcherInfos(step, sb);
        if (Object.keys(elementMatcher).length === 0) {
            sb.remove();
        }
        usedMatchers = {
            ...usedMatchers,
            ...elementMatcher,
        };

        if (step.control.controlId.use || Object.keys(elementMatcher).length > 0) {
            this._pages[viewName]?.addPressAction(usedMatchers as AdderOptions);
            this._pages['Common']?.addPressAction(usedMatchers as AdderOptions);
        }

        sb.add('});');
        return sb.toString();
    }

    private _createInputStep(
        step: InputStep,
        viewName: string = '<view_name>'
    ): string {
        const sb = new StringBuilder();
        sb.addTab(2).add('When.on').add(viewName).add('.inputTextInto({');

        let usedMatchers: Record<string, unknown> = {};
        if (step.control.controlId.use) {
            sb.add(`id: {value: "${step.control.controlId.id}",isRegex: true}`).add(',');
            usedMatchers['enterText'] = true;
        }

        const elementMatcher = this._createObjectMatcherInfos(step, sb);
        if (Object.keys(elementMatcher).length === 0) {
            sb.remove();
        }
        usedMatchers = {
            ...usedMatchers,
            ...elementMatcher,
        };

        if (step.control.controlId.use || Object.keys(elementMatcher).length > 0) {
            this._pages[viewName]?.addEnterTextAction(usedMatchers as AdderOptions);
            this._pages['Common']?.addEnterTextAction(usedMatchers as AdderOptions);
        }

        sb.add('}, ');
        sb.add(`"${step.getResultText()}"`);
        sb.add(');');
        return sb.toString();
    }

    private _createValidateStep(
        step: Step,
        viewName: string = '<view_name>'
    ): string {
        const validate = new StringBuilder();
        validate.addTab(2).add('Then.on').add(viewName).add('.thereShouldBe({');
        let usedMatchers: Record<string, unknown> = {};
        if (step.control.controlId.use) {
            validate.add(`id: {value: "${step.control.controlId.id}",isRegex: true}`).add(',');
        }

        const elementMatcher = this._createObjectMatcherInfos(step, validate);
        if (Object.keys(elementMatcher).length === 0) {
            validate.remove();
        }
        usedMatchers = {
            ...usedMatchers,
            ...elementMatcher,
        };

        if (step.control.controlId.use || Object.keys(elementMatcher).length > 0) {
            this._pages[viewName]?.addValidationStep(usedMatchers as AdderOptions);
            this._pages['Common']?.addValidationStep(usedMatchers as AdderOptions);
        }

        validate.add('});');
        return validate.toString();
    }

    private _createObjectMatcherInfos(
        step: Step,
        sb: StringBuilder
    ): Record<string, unknown> {
        const matcherAttributes = step.control.properties?.filter((att) => att.use)
            .map(this._createAttributeValue.bind(this)) || [];

        const bindingsAttributes = step.control.bindings?.filter((b) => b.use)
            .map(this._createBindingValue.bind(this))
            .filter((bs, i, a) => a.indexOf(bs) === i) || [];

        const i18nTexts = step.control.i18nTexts?.filter((b) => b.use)
            .map(this._createI18nValue.bind(this)) || [];

        const oReturn: Record<string, unknown> = {};
        if (matcherAttributes.length <= 2 && matcherAttributes.length > 0) {
            sb.add('attributes: [').addMultiple(matcherAttributes, ', ').add(']');
        } else if (matcherAttributes.length > 0) {
            sb.addNewLine();
            sb.addTab(3);
            sb.add('attributes: [');
            sb.addNewLine();
            sb.addTab(4);
            matcherAttributes.forEach((p: string) => {
                sb.add(p);
                sb.add(',');
                sb.addNewLine();
                sb.addTab(4);
            });
            sb.remove();
            sb.addTab(3);
            sb.add(']');
            sb.addNewLine();
            sb.addTab(2);
        }

        if (matcherAttributes.length > 0) {
            oReturn['attribute'] = true;
        }

        if (matcherAttributes.length > 0 && bindingsAttributes.length > 0) {
            sb.add(',');
        }

        if (bindingsAttributes.length <= 2 && bindingsAttributes.length > 0) {
            sb.add('bindings: [').addMultiple(bindingsAttributes, ', ').add(']');
        } else if (bindingsAttributes.length > 0) {
            sb.addNewLine();
            sb.addTab(3);
            sb.add('bindings: [');
            sb.addNewLine();
            sb.addTab(4);
            bindingsAttributes.forEach((p: string) => {
                sb.add(p);
                sb.add(',');
                sb.addNewLine();
                sb.addTab(4);
            });
            sb.remove();
            sb.addTab(3);
            sb.add(']');
            sb.addNewLine();
            sb.addTab(2);
        }
        if (bindingsAttributes.length > 0) {
            oReturn['binding'] = true;
        }

        if (
            (matcherAttributes.length > 0 || bindingsAttributes.length > 0) &&
            i18nTexts.length > 0
        ) {
            sb.add(',');
        }

        if (i18nTexts.length <= 2 && i18nTexts.length > 0) {
            sb.add('i18n: [').addMultiple(i18nTexts, ', ').add(']');
        } else if (i18nTexts.length > 0) {
            sb.addNewLine();
            sb.addTab(3);
            sb.add('i18n: [');
            sb.addNewLine();
            sb.addTab(4);
            i18nTexts.forEach((p: string) => {
                sb.add(p);
                sb.add(',');
                sb.addNewLine();
                sb.addTab(4);
            });
            sb.remove();
            sb.addTab(3);
            sb.add(']');
            sb.addNewLine();
            sb.addTab(2);
        }
        if (i18nTexts.length > 0) {
            oReturn['i18n'] = true;
        }

        return oReturn;
    }

    private _createAttributeValue(e: {
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

    private _createBindingValue(e: {
        propertyName: string;
        bindingValue: string | number | boolean;
        modelPath: string;
        propertyPath: string;
        modelName: string;
        use: boolean;
    }): string {
        return `{path: "${e.modelPath}", modelName: ${e.modelName}, propertyPath: "${e.propertyPath}}"`;
    }

    private _createI18nValue(e: {
        propertyName: string;
        propertyPath: string;
        bindingValue: unknown;
        use: boolean;
    }): string {
        return `{key: "${e.propertyPath}", propertyName: "${e.propertyName}"}`;
    }

    private _sanatize(s: unknown): string {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
        return `"${s}"`.trim();
    }
}