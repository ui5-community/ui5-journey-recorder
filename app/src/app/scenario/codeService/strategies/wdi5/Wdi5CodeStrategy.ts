import { InputStep, Step, StepType } from 'src/app/classes/Step';
import { Page, TestScenario } from 'src/app/classes/testScenario';
import CodeStrategy from '../StrategyInterface';
import Wdi5PageBuilder from './Wdi5PageBuilder';
import Wdi5SingleStepStrategy from './Wdi5SingleStepStrategy';
import { PageType } from '../../codeService.service';

export default class Wdi5CodeStrategy implements CodeStrategy {
  // we treat each "page" as part of the entire journey and slice it up accordingly
  generateTestCode(scenario: TestScenario): any[] {
    const codes: any[] = [];
    scenario.testPages.forEach((page: Page) => {
      const code = {
        title: `part ${page.id} of Journey`,
        code: new Wdi5PageBuilder(
          page,
          page.view.relativeViewName,
          `#/${page.view.relativeViewName}`
        ).generate(),
        type: PageType.JOURNEY
      };
      codes.push(code);
    });
    return codes;
  }

  // no difference in wdi5 btw a step in a page or a standalone step

  generateStepCode(step: Step, indent: number = 0): string {
    switch (step.actionType) {
      case StepType.Click:
        return Wdi5SingleStepStrategy.generateSinglePressStep(step, indent);
      case StepType.Validation:
        return Wdi5SingleStepStrategy.generateSingleExistsStep(step, indent);
      case StepType.Input:
        return Wdi5SingleStepStrategy.generateSingleInputStep(step as InputStep, indent);
      default:
        return 'Unknown StepType';
    }
  }

  // no difference in wdi5 btw a step in a page or a standalone step
  generatePagedStepCode(step: Step, viewName?: string | undefined): string {
    return this.generateStepCode(step);
  }
}
