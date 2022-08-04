import { Injectable } from '@angular/core';

import { v4 as uuidV4 } from 'uuid';

import {
  ClickStep,
  InputStep,
  KeyPressStep,
  Page,
  Step,
  TestScenario,
  UnknownStep,
} from '../classes/testScenario';

@Injectable({
  providedIn: 'root',
})
export class ScenarioService {
  public createScenarioFromRecording(recording: any[]): TestScenario {
    const stepTree = this.transformToAst(
      this.reduceSteps(this.transformEventsToSteps(recording))
    );
    const pages = this.createPages(stepTree);
    const ts = new TestScenario(this.createUUID(), Date.now());
    pages.forEach((p) => ts.addPage(p));
    return ts;
  }

  private transformEventsToSteps(events: any): Step[] {
    return events.map((a: any) => {
      let res: Step;
      switch (a.type) {
        case 'clicked':
          res = new ClickStep();
          break;
        case 'keypress':
          res = new KeyPressStep(a.key, a.keyCode);
          break;
        default:
          res = new UnknownStep();
      }

      res.controlId = a.control.id;
      res.styleClasses = a.control.classes;
      res.actionLoc = a.location;
      return res;
    });
  }

  private reduceSteps(steps: Step[]): Step[][] {
    return steps.reduce((a: Step[][], b: Step): any[] => {
      const el = a.pop();
      if (!el) {
        a.push([b]);
      } else {
        if (el[0].equalsTo(b)) {
          el.push(b);
          a.push(el);
        } else {
          a.push(el);
          a.push([b]);
        }
      }
      return a;
    }, []);
  }

  private transformToAst(steps: Step[][]): Step[] {
    return steps.map((el) => {
      let res: Step = new UnknownStep();
      if (el.length === 1) {
        res = el[0];
      } else {
        if (el.length !== 0) {
          res = this.transformToTypings(el);
        }
      }
      return res;
    });
  }

  private transformToTypings(parts: Step[]): Step {
    const inputStep = new InputStep();
    return parts.reduce((a: InputStep, b: Step) => {
      if (b instanceof KeyPressStep) {
        a.addStep(b);
      } else if (b instanceof ClickStep) {
        a.actionLoc = b.actionLoc;
        a.controlId = b.controlId;
      }
      return a;
    }, inputStep);
  }

  private createPages(stepTree: Step[]): Page[] {
    const pages: Page[] = [];

    stepTree.forEach((s) => {
      const lastPage = pages.pop();
      if (!lastPage) {
        const p = new Page();
        p.location = s.actionLoc;
        p.addStep(s);
        pages.push(p);
      } else {
        if (lastPage.location === s.actionLoc) {
          lastPage.addStep(s);
          pages.push(lastPage);
        } else {
          pages.push(lastPage);
          const p = new Page();
          p.location = s.actionLoc;
          p.addStep(s);
          pages.push(p);
        }
      }
    });

    return pages;
  }

  private createUUID(): string {
    return uuidV4();
  }
}
