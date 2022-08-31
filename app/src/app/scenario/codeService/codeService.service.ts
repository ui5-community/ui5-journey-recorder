import { Injectable } from '@angular/core';
import { Step, TestScenario } from 'src/app/classes/testScenario';
import OPA5CodeStrategy from './strategies/opa5/OPA5CodeStrategy';

export enum CodeStyles {
  OPA5 = 'OPA5',
  UNDEFINDED = 'UNDEFINED',
}

export type CodeOptions = {
  style: CodeStyles;
};

@Injectable({
  providedIn: 'root',
})
export class CodeService {
  public static generateScenarioCode(
    scenario: TestScenario,
    options?: CodeOptions
  ): { title: string; code: string }[] {
    const lang = options?.style || CodeStyles.UNDEFINDED;
    switch (lang) {
      case CodeStyles.OPA5:
        return new OPA5CodeStrategy().generateTestCode(scenario);
      default:
        return [];
    }
  }

  public static generateStepCode(
    testStep: Step,
    options?: CodeOptions
  ): string {
    const lang = options?.style || CodeStyles.UNDEFINDED;
    switch (lang) {
      case CodeStyles.OPA5:
        return new OPA5CodeStrategy().generateStepCode(testStep);
      default:
        return '';
    }
  }

  public static generatePagedStepCode(
    testStep: Step,
    options?: CodeOptions
  ): string {
    const lang = options?.style || CodeStyles.UNDEFINDED;
    switch (lang) {
      case CodeStyles.OPA5:
        return new OPA5CodeStrategy().generatePagedStepCode(testStep);
      default:
        return '';
    }
  }
}
