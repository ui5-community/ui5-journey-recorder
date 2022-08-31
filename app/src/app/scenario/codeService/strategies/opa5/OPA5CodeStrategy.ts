import StringBuilder from 'src/app/classes/StringBuilder';
import {
  Page,
  Step,
  StepType,
  TestScenario,
} from 'src/app/classes/testScenario';
import CodeStrategy from '../StrategyInterface';
import CommonPageBuilder from './CommonPageBuilder';
import OPA5SingleStepStrategy from './OPA5SingleStepStrategy';
import ViewPageBuilder from './ViewPageBuilder';

export default class OPA5CodeStrategy implements CodeStrategy {
  private _pages: { [key: string]: any } = {};

  public generateTestCode(scenario: TestScenario): any[] {
    const codes: any[] = [];
    const jurney: { [key: string]: any } = {
      title: '',
      content: [],
    };

    this._pages['Common'] = new CommonPageBuilder('', '', '');

    scenario.testPages.forEach((p: Page) => {
      this._pages[p.view.relativeViewName] = new ViewPageBuilder(p);
    });

    //(2) execute script
    jurney['title'] = scenario.name.replace(/\s/gm, '_');

    this._setupHeader(jurney);

    /* this._createConstants(scenario.testPages); */

    jurney['content'].push(
      new StringBuilder()
        .addNewLine()
        .addTab()
        .add('QUnit.module("')
        .add(scenario.name)
        .add('");')
        .addNewLine(2)
        .toString()
    );

    this._createAppStartStep(jurney, scenario);

    jurney['content'].push(this._createTestSteps(scenario));

    this._createAppCloseStep(jurney);

    jurney['content'].push('});');

    jurney['code'] = jurney['content'].reduce(
      (a: string, b: string) => `${a}${b}`,
      ''
    );

    codes.push(jurney);
    const posNamespace = Object.values(this._pages)
      .map((p) => p.namespace)
      .filter((n) => n !== '<namespace>')[0];
    if (posNamespace) {
      this._pages['Common'].namespace = posNamespace;
    }
    Object.entries(this._pages).forEach((entry: [string, any]) => {
      var oCode = {
        title: `${entry[0]}-Page`,
        code: entry[1].generate(),
      };
      codes.push(oCode);
    });

    return codes;
  }

  public generateStepCode(step: Step): string {
    switch (step.actionType) {
      case StepType.Click:
        return OPA5SingleStepStrategy.generateSinglePressStep(step);
      default:
        return 'Unknown StepType';
    }
  }

  public generatePagedStepCode(
    step: Step,
    viewName: string = '<view_name>'
  ): string {
    switch (step.actionType) {
      case StepType.Click:
        return this._createClickStep(step, viewName);
      default:
        return '';
    }
  }

  private _capitalize(text: string) {
    if (typeof text !== 'string') {
      return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private _createAppCloseStep(jurney: { [key: string]: any }) {
    var oCloseStep = new StringBuilder();
    oCloseStep
      .addNewLine()
      .addTab(2)
      .add('Given.iTeardownTheApp();')
      .addNewLine()
      .addTab()
      .add('});')
      .addNewLine();
    jurney['content'].push(oCloseStep.toString());
  }

  private _createTestSteps(scenario: TestScenario) {
    const pages = scenario.testPages;
    const steps = new StringBuilder();
    pages.forEach((page: Page) => {
      page.steps.forEach((step: Step) => {
        const stepCode = this.generatePagedStepCode(
          step,
          page.view.relativeViewName
        );
        if (stepCode) {
          steps.add(stepCode);
          steps.addNewLine();
        }
      });
    });
    return steps.toString();
  }

  private _createAppStartStep(
    jurney: { [key: string]: any },
    scenario: TestScenario
  ) {
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

    jurney['content'].push(startStep.toString());
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

  private _setupHeader(jurney: { [key: string]: any }) {
    var oCode = new StringBuilder('sap.ui.define([');
    oCode.addNewLine().addTab().add('"sap/ui/test/Opa5",');
    oCode.addNewLine().addTab().add('"sap/ui/test/opaQunit"');
    oCode.addNewLine().add('], function (Opa5, opaTest) {');
    oCode.addNewLine().addTab().add('"use strict";');
    oCode.addNewLine();
    jurney['content'].push(oCode.toString());
  }

  private _createClickStep(step: Step, viewName: string = '<view_name>') {
    var sb = new StringBuilder();
    sb.addTab(2).add('When.on').add(viewName).add('.pressOn({');

    if (!step.controlId.startsWith('__')) {
      sb.add(`id: {value: "${step.controlId}",isRegex: true}`);
      this._pages[viewName]?.addPressAction({
        press: true,
      });
      this._pages['Common']?.addPressAction({
        press: true,
      });
    } else {
      var oUsedMatchers = this._createObjectMatcherInfos(step, sb);
      oUsedMatchers['press'] = true;
      this._pages[viewName]?.addPressAction(oUsedMatchers);
      this._pages['Common']?.addPressAction(oUsedMatchers);
    }

    sb.add('});');
    return sb.toString();
  }

  private _createObjectMatcherInfos(
    step: Step,
    sb: StringBuilder
  ): { [key: string]: any } {
    var objectMatcher: { [key: string]: any } = {};
    step.controlAttributes
      .filter((att) => att.use)
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
    e: { name: string; value: any; use: boolean },
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
      objectMatcher['ATTR'].push('{' + e.name + ': ' + value + '}');
    } else {
      objectMatcher['ATTR'] = ['{' + e.name + ': ' + value + '}'];
    }
  }

  private _sanatize(s: string): string {
    return `"${s}"`.trim();
  }
}
