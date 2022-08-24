import { Injectable } from '@angular/core';

import { v4 as uuidV4 } from 'uuid';
import { ChromeExtensionService } from '../chromeExtensionService/chrome_extension_service';
import { RequestBuilder, RequestMethod } from '../../classes/requestBuilder';

import {
  ClickStep,
  InputStep,
  KeyPressStep,
  Page,
  Step,
  TestScenario,
  UnknownStep,
} from '../../classes/testScenario';
import { ScenarioStorageService } from '../localStorageService/scenarioStorageService.service';

@Injectable({
  providedIn: 'root',
})
export class ScenarioService {
  constructor(
    private local_storage_service: ScenarioStorageService,
    private chr_ext_srv: ChromeExtensionService
  ) {}

  private cachedScenarios: TestScenario[] = [];

  public getAllScenarios(): Promise<TestScenario[]> {
    return this.local_storage_service.getAll();
  }

  public createScenarioFromRecording(recording: any[]): TestScenario {
    const stepTree = this.transformToAst(
      this.reduceSteps(this.transformEventsToSteps(recording))
    );
    const pages = this.createPages(stepTree);
    const ts = new TestScenario(this.createUUID(), Date.now());
    pages.forEach((p) => ts.addPage(p));
    this.cachedScenarios.push(ts);
    return ts;
  }

  public getScenario(id: string): Promise<TestScenario> {
    const s = this.cachedScenarios.find((cs) => cs.id === id);
    if (s) {
      return Promise.resolve(s);
    } else {
      return this.local_storage_service
        .getById(id)
        .then((scen: TestScenario) => {
          this.cachedScenarios.push(scen);
          return scen;
        });
    }
  }

  public saveScenario(scenario: TestScenario): Promise<void> {
    return this.local_storage_service.save(scenario);
  }

  public getAttributeFromControl(
    controlID: string,
    attributes: string[]
  ): Promise<{ [key: string]: any }> {
    const rb = new RequestBuilder();
    rb.setUrl('/controls/(:id)');
    rb.setMethod(RequestMethod.GET);
    rb.addPathParam('id', controlID);
    rb.addSearchParam('attributes', '(' + attributes.join(' and ') + ')');
    return this.chr_ext_srv.sendSyncMessage(rb.build());
  }

  public async getStep(scenario_id: string, control_id: string): Promise<Step> {
    let scen = this.cachedScenarios.find((s) => s.id === scenario_id);
    if (!scen) {
      scen = await this.local_storage_service.getById(scenario_id);
      this.cachedScenarios.push(scen);
    }
    const step = scen.testPages
      .map((tp) => tp.steps)
      .reduce((a, b) => [...a, ...b], [])
      .find((s: Step) => s.controlId === control_id);
    if (!step) {
      return Promise.reject();
    }
    return step;
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
      res.controlType = a.control.type;
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
