import { Step, StepType } from 'src/app/classes/Step';
import { Page, TestScenario } from 'src/app/classes/testScenario';
import CodeStrategy from '../StrategyInterface';
import Wdi5PageBuilder from './Wdi5PageBuilder';
import Wdi5SingleStepStrategy from './Wdi5SingleStepStrategy';

export default class Wdi5CodeStrategy implements CodeStrategy {
  generateTestCode(scenario: TestScenario): any[] {
    const codes: any[] = [];
    scenario.testPages.forEach((page: Page) => {
      const code = {
        title: `${page.view.relativeViewName}.page.js`,
        code: new Wdi5PageBuilder(
          page,
          page.view.relativeViewName,
          `#/${page.view.relativeViewName}`
        ).generate(),
      };
      codes.push(code);
    });
    return codes;
  }

  generateStepCode(step: Step): string {
    switch (step.actionType) {
      case StepType.Click:
        return Wdi5SingleStepStrategy.generateSinglePressStep(step);
      case StepType.Validation:
        return Wdi5SingleStepStrategy.generateSingleExistsStep(step);
      case StepType.Input:
        return Wdi5SingleStepStrategy.generateSingleInputStep(step);
      default:
        return 'Unknown StepType';
    }
  }

  generatePagedStepCode(step: Step, viewName?: string | undefined): string {
    return this.generateStepCode(step)
  }
}
