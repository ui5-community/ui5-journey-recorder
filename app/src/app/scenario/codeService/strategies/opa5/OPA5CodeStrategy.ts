import StringBuilder from 'src/app/classes/StringBuilder';
import {
  Page,
  Step,
  StepType,
  TestScenario,
} from 'src/app/classes/testScenario';
import CodeStrategy from '../StrategyInterface';
import CommonPageBuilder from './CommonPageBuilder';

export default class OPA5CodeStrategy implements CodeStrategy {
  private _pages: { [key: string]: any } = {};
  private _code: {
    title?: string;
    code?: string;
    codeName?: string;
    type: string;
    order: number;
    content: string[];
    constants: string[];
  } = {
    type: 'CODE',
    order: 1,
    content: [],
    constants: [],
  };
  private _customMatcher: { [key: string]: any } = {};
  private _commonPage: CommonPageBuilder | undefined;
  private _namespace: string = 'template';

  public generateTestCode(scenario: TestScenario): any[] {
    let codes: any[] = [];
    this._commonPage = new CommonPageBuilder('', '', '');

    //(2) execute script
    this._code.title = scenario.name.replace(/\s/gm, '_');

    this._setupHeader();

    this._createConstants(scenario.testPages);

    this._code.content.push(
      new StringBuilder()
        .addNewLine()
        .addTab()
        .add('QUnit.module("')
        .add(scenario.name)
        .add('");')
        .addNewLine(2)
        .toString()
    );

    this._createAppStartStep(scenario);

    this._createTestSteps(scenario);

    this._createAppCloseStep();

    this._code.content.push('});');

    this._code.code = this._code.content.reduce((a, b) => a + b, '');

    codes.push(this._code);

    var order = 1;
    var namespace = [
      ...new Set(Object.values(this._pages).map((el) => el.getNamespace())),
    ].filter((nsp) => nsp !== '<template>')[0];
    namespace = namespace ? namespace : '<template>';
    Object.keys(this._pages).forEach((key: string) => {
      if (this._pages[key].getNamespace() === '<template>') {
        this._pages[key].setNamespace(namespace);
      }
      order = order++;
      var oCode = {
        title: `${key}Page`,
        type: 'CODE',
        order: order,
        code: this._pages[key].generate(),
      };
      codes.push(oCode);
    });

    Object.keys(this._customMatcher).forEach((key: string) => {
      order = order++;
      var oCode = {
        title: `${this._capitalize(key)}Matcher`,
        type: 'CODE',
        order: order,
        code: this._customMatcher[key].generate(),
      };
      codes.push(oCode);
    });

    codes.push({
      title: 'Common',
      type: 'CODE',
      order: order++,
      code: this._commonPage.generate(),
    });

    return codes;
  }

  private _capitalize(text: string) {
    if (typeof text !== 'string') {
      return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private _createAppCloseStep() {
    var oCloseStep = new StringBuilder();
    oCloseStep
      .addNewLine()
      .addTab(2)
      .add('Given.iTeardownTheApp();')
      .addNewLine()
      .addTab()
      .add('});')
      .addNewLine();
    this._code.content.push(oCloseStep.toString());
  }

  private _createTestSteps(scenario: TestScenario) {
    //@TODO
    /* var oSteps = new StringBuilder();
    //from here starts the real testing
    for (var step in aTestSteps) {
        var stepCode = this.createTestStep(oCodeSettings, aTestSteps[step]);
        if (stepCode) {
            oSteps.add(stepCode);
        }
    }
    this.__code.content.push(oSteps.toString()); */
  }

  private _createAppStartStep(scenario: TestScenario) {
    var startStep = new StringBuilder();
    startStep
      .addTab()
      .add('opaTest("')
      .add(scenario.name)
      .add('", function(Given, When, Then) {')
      .addNewLine();
    var sNavHash = '';
    if (scenario.startUrl.indexOf('#') > -1) {
      sNavHash = scenario.startUrl.substring(
        scenario.startUrl.indexOf('#') + 1
      );
    }
    startStep
      .addTab(2)
      .add('Given.iStartTheAppByHash({hash: "')
      .add(sNavHash)
      .add('"});')
      .addNewLine(2);

    this._code.content.push(startStep.toString());
  }

  private _createConstants(testPages: Page[]) {
    //@TODO
    /*
    aElements.forEach(function (el) {
        for (var sK in el.selector.selectorUI5) {
            var properties = el.selector.selectorUI5[sK];
            for (var sPK in properties.properties) {
                var sValue = typeof Object.values(properties.properties[sPK])[0] === "string" ? Object.values(properties.properties[sPK])[0].trim() : Object.values(properties.properties[sPK])[0];
                var constant = this.__code.constants.filter(c => c.value === sValue)[0];
                if (constant) {
                    properties.properties[sPK]['constant'] = constant.symbol;
                } else {
                    var newConstant = this.__createConstant(sValue);
                    this.__code.constants.push(newConstant);
                    properties.properties[sPK]['constant'] = newConstant.symbol;
                }
            }
        }
    }.bind(this));
    if (this.__code.constants.length > 0) {
        var constants = Array(2).join('\t') +
            'var' +
            this.__code.constants
            .map(c => Array(3).join('\t') + c.symbol + ' = \"' + c.value + '\"')
            .reduce((a, b) => a + ',\n' + b, '')
            .substring(2) +
            ';';
        this.__code.content.push(constants.replace(/var\t{2}/g, 'var ') + '\n');
    } */
  }

  private _setupHeader() {
    var oCode = new StringBuilder('sap.ui.define([');
    oCode.addNewLine().addTab().add('"sap/ui/test/Opa5",');
    oCode.addNewLine().addTab().add('"sap/ui/test/opaQunit"');
    oCode.addNewLine().add('], function (Opa5, opaTest) {');
    oCode.addNewLine().addTab().add('"use strict";');
    oCode.addNewLine();
    this._code.content.push(oCode.toString());
  }

  public generateStepCode(step: Step): string {
    switch (step.actionType) {
      case StepType.Click:
        return this._createClickStep(step);
      default:
        return '';
    }
  }

  private _createClickStep(step: Step) {
    var viewName = 'Detached';
    var sb = new StringBuilder();
    sb.addTab(2).add('When.on').add(viewName).add('.clickOn({');

    if (!step.controlId.startsWith('__')) {
      sb.add(`id: {value: "${step.controlId}",isRegex: true}`);
      /* this.__pages[viewName].addPressAction({
        press: true,
      }); */
      /* if (this.__commonPage) {
        this.__commonPage.addPressAction({
          press: true,
        });
      } */
    } else {
      var oUsedMatchers = this._createObjectMatcherInfos(step, sb);
      oUsedMatchers['press'] = true;
      /* this.__pages[viewName].addPressAction(oUsedMatchers);
      if (this.__commonPage) {
        this.__commonPage.addPressAction(oUsedMatchers);
      } */
    }

    sb.add('});');
    return sb.toString();
  }

  private _createObjectMatcherInfos(
    step: Step,
    sb: StringBuilder
  ): { [key: string]: any } {
    var objectMatcher: { [key: string]: any } = {};
    Object.entries(step.controlAttributes)
      .map((e) => ({ key: e[0], value: e[1] }))
      .forEach((e) => {
        this._createAttributeValue(e, objectMatcher);
      });

    for (var k in objectMatcher) {
      if (k !== 'ATTR') {
        sb.add(objectMatcher[k]).add(', ');
      }
    }
    sb.replace(/,\s*$/, '');

    var oReturn: { [key: string]: any } = {};
    if (objectMatcher['ATTR']) {
      objectMatcher['ATTR'] = [...new Set(objectMatcher['ATTR'])];
      if (objectMatcher['ATTR'].length <= 2) {
        sb.add('attributes: [')
          .addMultiple(objectMatcher['ATTR'], ', ')
          .add(']');
      } else {
        sb.addNewLine();
        sb.addTab(3);
        sb.add('attributes: [');
        sb.addNewLine();
        sb.addTab(4);
        objectMatcher['ATTR'].forEach((p: string) => {
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
      oReturn['attribute'] = true;
    }
    sb.replace(/,\s*$/, '');
    return oReturn;
  }

  private _createAttributeValue(
    e: { key: string; value: any },
    objectMatcher: { [key: string]: any }
  ): void {
    var value = e.value;

    if (typeof value === 'boolean') {
      value = Boolean(value);
    } else if (typeof value === 'number') {
      value = Number(value);
    } else {
      value = this._sanatize(e.value);
    }

    if (objectMatcher['ATTR']) {
      objectMatcher['ATTR'].push('{' + e.key + ': ' + value + '}');
    } else {
      objectMatcher['ATTR'] = ['{' + e.key + ': ' + value + '}'];
    }
  }

  private _sanatize(s: string): string {
    return `"${s}"`.trim();
  }
}
