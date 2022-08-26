import StringBuilder from 'src/app/classes/StringBuilder';
import { Step, StepType } from 'src/app/classes/testScenario';

export default class OPA5CodeStrategy {
  public createTestStep(step: Step): string {
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
