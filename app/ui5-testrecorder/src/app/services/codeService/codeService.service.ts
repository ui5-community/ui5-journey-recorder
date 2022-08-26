import { Injectable } from '@angular/core';
import { Step } from 'src/app/classes/testScenario';
import OPA5CodeStrategy from './strategies/OPA5CodeStrategy';

export enum CodeStyles {
  OPA5 = 'OPA5',
  UNDEFINDED = 'UNDEFINED',
}

export type CodeOptions = {
  language: CodeStyles;
};

@Injectable({
  providedIn: 'root',
})
export class CodeService {
  public static generateStepCode(
    testStep: Step,
    options?: CodeOptions
  ): string {
    const lang = options?.language || CodeStyles.UNDEFINDED;
    switch (lang) {
      case CodeStyles.OPA5:
        return new OPA5CodeStrategy().createTestStep(testStep);
      default:
        return '';
    }
  }
}
