import { Injectable } from '@angular/core';

import { v4 as uuidV4 } from 'uuid';
import { ChromeExtensionService } from '../chromeExtensionService/chrome_extension_service';
import { RequestBuilder, RequestMethod } from '../../classes/requestBuilder';

import { Page, TestScenario } from '../../classes/testScenario';
import { ScenarioStorageService } from '../localStorageService/scenarioStorageService.service';
import {
  ClickStep,
  Control,
  InputStep,
  IntermediateStep,
  KeyPressStep,
  Step,
  StepType,
  UnknownStep,
  ValidationStep,
} from 'src/app/classes/Step';

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

  public createScenarioFromRecording(
    recording: any[],
    ui5Version: string
  ): TestScenario {
    const ts = new TestScenario(this.createUUID(), Date.now());
    ts.version = ui5Version;
    const stepTree = this.transformToAst(
      this.reduceSteps(recording.map(Step.recordEventToStep))
    );
    const pages = this.createPages(stepTree);
    pages.forEach((p) => p.steps.forEach((s) => s.applyPreSelection()));
    pages.forEach((p) => ts.addPage(p));
    this.cachedScenarios.push(ts);
    return ts;
  }

  public getScenario(id: string): Promise<TestScenario | undefined> {
    const s = this.cachedScenarios.find((cs) => cs.id === id);
    if (s) {
      return Promise.resolve(s);
    } else {
      return this.local_storage_service
        .getById(id)
        .then((scen: TestScenario) => {
          this.cachedScenarios.push(scen);
          return scen;
        })
        .catch(() => {
          return undefined;
        });
    }
  }

  public saveScenario(scenario: TestScenario): Promise<void> {
    scenario.latestEdit = Date.now();
    return this.local_storage_service.save(scenario).then(() => {
      this.cachedScenarios = this.cachedScenarios.filter(
        (ts) => ts.id !== scenario.id
      );
      this.cachedScenarios.push(scenario);
    });
  }

  public deleteScenario(scenario: TestScenario): Promise<void> {
    return this.local_storage_service.removeScenario(scenario).then(() => {
      this.cachedScenarios = this.cachedScenarios.filter(
        (ts) => ts.id !== scenario.id
      );
    });
  }

  public getAttributeFromControl(
    controlID: string,
    attributes: string[]
  ): Promise<{ [key: string]: any }> {
    const rb = new RequestBuilder();
    rb.setUrl('/controls(:id)');
    rb.setMethod(RequestMethod.GET);
    rb.addPathParam('id', controlID);
    rb.addSearchParam('attributes', '(' + attributes.join(' and ') + ')');
    return this.chr_ext_srv.sendSyncMessage(rb.build());
  }

  public validateStepUniqueness(step: Step): Promise<any> {
    const rb = new RequestBuilder();
    rb.setMethod(RequestMethod.GET);
    if (step.useControlId) {
      rb.setUrl('/controls(:id)');
      rb.addPathParam('id', `'${step.controlId}'`);
    } else {
      rb.setUrl('/controls');
    }

    rb.addSearchParam(
      'attributes',
      JSON.stringify(step.controlAttributes.filter((att) => att.use))
    );

    if (!step.useControlId) {
      rb.addSearchParam('control_type', step.controlType);
    }

    rb.addSearchParam('count', '');

    if (this.chr_ext_srv.isConnectedToPage()) {
      return this.chr_ext_srv
        .sendSyncMessage(rb.build())
        .then((result: any) => {
          return { data: result.message };
        });
    } else {
      return this.chr_ext_srv
        .createTabByUrl(step.actionLoc)
        .then((tab: chrome.tabs.Tab) => {
          const p = {
            title: tab.title || '',
            path: tab.url || tab.pendingUrl || '',
            id: tab.id || 0,
            icon: tab.favIconUrl || '',
          };
          this.chr_ext_srv.setCurrentPage(p);
          return this.chr_ext_srv.focus_page(p).then(() => {
            return this.chr_ext_srv.connectToCurrentPage().then(() => {
              return this.chr_ext_srv
                .sendSyncMessage(rb.build())
                .then((result: any) => {
                  return { data: result.message };
                });
            });
          });
        });
    }
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

  private reduceSteps(steps: IntermediateStep[]): IntermediateStep[][] {
    return steps.reduce(
      (a: IntermediateStep[][], b: IntermediateStep): any[] => {
        const el = a.pop();
        if (!el) {
          a.push([b]);
        } else {
          if (el[0].equalsTo(b) && b.actionType === StepType.KeyPress) {
            el.push(b);
            a.push(el);
          } else {
            a.push(el);
            a.push([b]);
          }
        }
        return a;
      },
      []
    );
  }

  private transformToAst(steps: IntermediateStep[][]): IntermediateStep[] {
    return steps.map((el) => {
      let res: IntermediateStep = new UnknownStep();
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

  private transformToTypings(parts: IntermediateStep[]): IntermediateStep {
    const inputStep = parts.reduce((a: InputStep, b: IntermediateStep) => {
      if (b instanceof KeyPressStep) {
        a.addStep(b);
      } else if (b instanceof ClickStep || b instanceof ValidationStep) {
        a.actionLoc = b.actionLoc;
        a.styleClasses = b.styleClasses;
        a.recordReplaySelector = b.recordReplaySelector;
        a.controlId = b.controlId;
        a.controlType = b.controlType;
        a.controlAttributes = b.controlAttributes;
        a.controlBindings = b.controlBindings;
        a.controlI18nTexts = b.controlI18nTexts;
      }
      return a;
    }, new InputStep());
    inputStep.applyPreSelection();
    const temp = inputStep as IntermediateStep;
    temp.view = parts[0]
      ? parts[0].view
      : { absoluteViewName: '', relativeViewName: '' };
    return temp;
  }

  private createPages(stepTree: IntermediateStep[]): Page[] {
    const pages: Page[] = [];

    stepTree.forEach((s) => {
      const lastPage = pages.pop();
      if (!lastPage) {
        const p = new Page('' + pages.length);
        p.location = s.actionLoc;
        p.view = s.view || { absoluteViewName: '', relativeViewName: '' };
        delete s.view;
        p.addStep(s);
        pages.push(p);
      } else {
        if (lastPage.location === s.actionLoc) {
          delete s.view;
          lastPage.addStep(s);
          pages.push(lastPage);
        } else {
          pages.push(lastPage);
          const p = new Page('' + pages.length);
          p.location = s.actionLoc;
          p.view = s.view || { absoluteViewName: '', relativeViewName: '' };
          delete s.view;
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
