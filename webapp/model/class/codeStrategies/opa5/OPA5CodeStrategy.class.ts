import { StepType } from "../../../enum/StepType";
import Journey from "../../Journey.class";
import { InputStep, Step } from "../../Step.class";
import StringBuilder from "../../StringBuilder.class";
import { CodePage } from "../CodePage.type";
import CommonPageBuilder from "./CommonPageBuilder.class";
import OPA5SingleStepStrategy from "./OPA5SingleStepStrategy.class";
import { AdderOptions, PageBuilder } from "./PageBuilder.class";
import ViewPageBuilder from "./ViewPageBuilder.class";

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

    public generateJourneyCode(journey: Journey): CodePage[] {

        const codes: CodePage[] = [];
        const journeyCode: CodePage = {
            title: '',
            code: new StringBuilder(),
            type: 'journey'
        };
        //(1) setup codes environment
        this._pages['Common'] = new CommonPageBuilder('', '', '');

        //(2) execute script
        journeyCode.title = journey.name.replace(/\s/gm, '_');

        this._setupHeader(journeyCode);

        /* this._createConstants(scenario.testPages); */

        (journeyCode.code as StringBuilder).addBuilder(
            new StringBuilder()
                .addNewLine()
                .addTab()
                .add('QUnit.module("')
                .add(journey.name)
                .add('");')
                .addNewLine(2)
        );

        this._createAppStartStep(journeyCode, journey);

        (journeyCode.code as StringBuilder).addBuilder(this._createTestSteps(journey));

        this._createAppCloseStep(journeyCode);

        (journeyCode.code as StringBuilder).add('});');

        journeyCode.code = (journeyCode.code as StringBuilder).toString();

        codes.push(journeyCode);

        const posNamespace = Object.values(this._pages)
            .map((p) => p.namespace)
            .filter((n) => n !== '<namespace>')[0];
        if (posNamespace) {
            this._pages['Common'].namespace = posNamespace;
        }

        Object.entries(this._pages).forEach((entry: [string, PageBuilder]) => {
            const oCode: CodePage = {
                title: `${entry[0]}-Page`,
                code: entry[1].generate(),
                type: 'page',
            };
            codes.push(oCode);
        });

        return codes;
    }

    public generatePagedStepCode(
        step: Step
    ): string {
        if (!this._pages[step.viewInfos.relativeViewName]) {
            this._pages[step.viewInfos.relativeViewName] = new ViewPageBuilder(step);
        }
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

    private _setupHeader(journey: CodePage) {
        const oCode = new StringBuilder('sap.ui.define([');
        oCode.addNewLine().addTab().add('"sap/ui/test/Opa5",');
        oCode.addNewLine().addTab().add('"sap/ui/test/opaQunit"');
        oCode.addNewLine().add('], function (Opa5, opaTest) {');
        oCode.addNewLine().addTab().add('"use strict";');
        oCode.addNewLine();
        (journey.code as StringBuilder).addBuilder(oCode);
    }

    private _createAppStartStep(
        journeyCode: CodePage,
        journey: Journey
    ) {
        const startStep = new StringBuilder();
        startStep
            .addTab()
            .add('opaTest("')
            .add(journey.name)
            .add('", function(Given, When, Then) {')
            .addNewLine();
        let sNavHash = '';
        if (journey.startUrl.indexOf('#') > -1) {
            sNavHash = journey.startUrl.substring(
                journey.startUrl.indexOf('#') + 1
            );
        }
        startStep
            .addTab(2)
            .add('Given.iStartTheAppByHash({hash: "')
            .add(sNavHash)
            .add('"});')
            .addNewLine(2);

        (journeyCode.code as StringBuilder).addBuilder(startStep);
    }

    private _createTestSteps(journey: Journey): StringBuilder {
        const steps = journey.steps;
        const stepsCode = new StringBuilder();
        steps.forEach((step: Step) => {
            const stepCode = this.generatePagedStepCode(step);
            if (stepCode) {
                stepsCode.add(stepCode);
                stepsCode.addNewLine();
            }
        });
        return stepsCode;
    }

    private _createAppCloseStep(journeyCode: CodePage) {
        const oCloseStep = new StringBuilder();
        oCloseStep
            .addNewLine()
            .addTab(2)
            .add('Given.iTeardownTheApp();')
            .addNewLine()
            .addTab()
            .add('});')
            .addNewLine();
        (journeyCode.code as StringBuilder).addBuilder(oCloseStep);
    }

    private _createClickStep(
        step: Step
    ): string {
        const sb = new StringBuilder();
        const viewName = step.viewInfos.relativeViewName || '<view_name>';

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
    ): string {
        const sb = new StringBuilder();
        const viewName = step.viewInfos.relativeViewName || '<view_name>';
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
        step: Step
    ): string {
        const validate = new StringBuilder();
        const viewName = step.viewInfos.relativeViewName || '<view_name>';
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