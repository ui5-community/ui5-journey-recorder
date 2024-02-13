import { Step } from 'src/app/classes/Step';
import { TestScenario } from 'src/app/classes/testScenario';

export default interface CodeStrategy {
  generateTestCode(scenario: TestScenario): any[];
  generateStepCode(step: Step): string;
  generatePagedStepCode(step: Step, viewName?: string): string;
}
