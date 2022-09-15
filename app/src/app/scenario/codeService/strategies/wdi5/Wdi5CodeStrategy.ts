import { TestScenario, Step, StepType } from 'src/app/classes/testScenario';
import CodeStrategy from '../StrategyInterface';
import Wdi5CodePageBuilder from './Wdi5PageBuilder';
import Wdi5RootPageBuilder from './Wdi5RootPageBuilder';
import Wdi5SingleStepStrategy from './Wdi5SingleStepStrategy';

export default class Wdi5CodeStrategy implements CodeStrategy {
  generateTestCode(scenario: TestScenario): any[] {
    const codes: any[] = [];
    const pages: { [key: string]: Wdi5CodePageBuilder } = {};
    pages['Page'] = new Wdi5RootPageBuilder();

    Object.entries(pages).forEach((entry: [string, Wdi5CodePageBuilder]) => {
      const code = {
        title: `${entry[0]}-Page`,
        code: entry[1].generate(),
      };
      //@TODO: Generate the correct Journey and wdi5 page codes
      codes.push(code);
    });
    return codes;
  }
  generateStepCode(step: Step): string {
    switch (step.actionType) {
      case StepType.Click:
        return Wdi5SingleStepStrategy.generateSinglePressStep(step);
      default:
        return 'Unknown StepType';
    }
  }
  generatePagedStepCode(step: Step, viewName?: string | undefined): string {
    return '@TODO';
  }
}
