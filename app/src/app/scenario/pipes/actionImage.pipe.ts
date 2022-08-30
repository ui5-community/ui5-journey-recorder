import { Pipe, PipeTransform } from '@angular/core';
import { Step, StepType } from '../../classes/testScenario';

@Pipe({
  name: 'actionImage',
})
export class ActionImagePipe implements PipeTransform {
  transform(type?: StepType): string {
    switch (type) {
      case StepType.Click:
        return 'mouse';
      case StepType.KeyPress:
      case StepType.Input:
        return 'keyboard';
      default:
        return 'question_mark';
    }
  }
}
