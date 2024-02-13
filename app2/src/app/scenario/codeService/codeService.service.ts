import { Injectable } from '@angular/core';
import { Step } from 'src/app/classes/Step';
import { TestScenario } from 'src/app/classes/testScenario';
import OPA5CodeStrategy from './strategies/opa5/OPA5CodeStrategy';
import Wdi5CodeStrategy from './strategies/wdi5/Wdi5CodeStrategy';
import Wdi5SingleStepStrategy from './strategies/wdi5/Wdi5SingleStepStrategy';

export enum CodeStyles {
  OPA5 = 'OPA5',
  WDI5 = 'wdi5',
  UNDEFINDED = 'UNDEFINED',
}

export type CodeOptions = {
  style: CodeStyles;
};

export enum PageType {
  JOURNEY = 'journey',
  PAGE = 'page',
}

@Injectable({
  providedIn: 'root',
})
export class CodeService {
  public static generateScenarioCode(
    scenario: TestScenario,
    options?: CodeOptions
  ): { title: string; code: string; type: 'journey' | 'page' }[] {
    const lang = options?.style || CodeStyles.UNDEFINDED;
    switch (lang) {
      case CodeStyles.OPA5:
        return new OPA5CodeStrategy().generateTestCode(scenario);
      case CodeStyles.WDI5:
        return new Wdi5CodeStrategy().generateTestCode(scenario);
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
      case CodeStyles.WDI5:
        return new Wdi5CodeStrategy().generateStepCode(testStep);
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
      case CodeStyles.WDI5:
        return new Wdi5CodeStrategy().generatePagedStepCode(testStep);
      default:
        return '';
    }
  }
}
