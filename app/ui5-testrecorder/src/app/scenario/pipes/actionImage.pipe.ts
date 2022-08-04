import { Pipe, PipeTransform } from '@angular/core';
import { Step, StepType } from '../../services/classes/testScenario';

@Pipe({
  name: 'actionImage',
})
export class ActionImagePipe implements PipeTransform {
  transform(type: StepType): string {
    switch (type) {
      case StepType.Click:
        return 'assets/icons/mouse-click-icon.svg';
      case StepType.KeyPress:
      case StepType.Input:
        return 'assets/icons/button-icon.svg';
      default:
        return 'assets/icons/question-mark-svgrepo-com.svg';
    }
  }
}
