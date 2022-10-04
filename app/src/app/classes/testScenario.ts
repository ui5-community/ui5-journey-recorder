import { Stringify } from './interfaces';
import { Step } from './Step';

export type Key = {
  key: string;
  keyCode: number;
};

export class TestScenario implements Stringify {
  private scenario_id: string;
  private created: number;
  private edited: number;
  private pages: Page[];
  private scenario_name: string;
  private ui5_version: string;

  constructor(id: string, timestamp?: number) {
    this.created = timestamp || -1;
    this.edited = timestamp || -1;
    this.pages = [];
    this.scenario_id = id;
    this.scenario_name = '';
    this.ui5_version = '';
  }

  public addPage(p: Page) {
    this.pages.push(p);
  }

  public get id(): string {
    return this.scenario_id;
  }

  public get testPages(): Page[] {
    return this.pages;
  }

  public get creationDate(): number {
    return this.created;
  }

  public set latestEdit(le: number) {
    this.edited = le;
  }

  public get latestEdit(): number {
    return this.edited;
  }

  public get startUrl(): string {
    return this.pages.length === 0 ? '' : this.pages[0].location;
  }

  public get name(): string {
    return this.scenario_name;
  }

  public set name(n: string) {
    this.scenario_name = n;
  }

  public get version(): string {
    return this.ui5_version;
  }

  public set version(version: string) {
    this.ui5_version = version;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  public static fromJSON(json: string): TestScenario {
    const parsedObj = JSON.parse(json);
    const testScen = new TestScenario(parsedObj.scenario_id, parsedObj.created);
    testScen.latestEdit = parsedObj.edited;
    testScen.name = parsedObj.scenario_name;
    testScen.version = parsedObj.ui5_version;

    if (parsedObj.pages) {
      parsedObj.pages.forEach((p: any) => {
        testScen.addPage(Page.fromJSON(JSON.stringify(p)));
      });
    }
    return testScen;
  }
}

export class Page implements Stringify {
  private page_id: string = '';
  private page_location: string = '';
  private page_steps: Step[] = [];
  private view_information: {
    absoluteViewName: string;
    relativeViewName: string;
  } = {
    absoluteViewName: '',
    relativeViewName: '',
  };

  constructor(id: string) {
    this.page_id = id;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  get id(): string {
    return this.page_id;
  }

  set location(loc: string) {
    this.page_location = loc;
  }

  set view(v: { absoluteViewName: string; relativeViewName: string }) {
    this.view_information = v;
  }

  get location(): string {
    return this.page_location;
  }

  get steps(): Step[] {
    return this.page_steps;
  }

  get view(): { absoluteViewName: string; relativeViewName: string } {
    return this.view_information;
  }

  public addStep(s: Step) {
    this.page_steps.push(s);
  }

  public static fromJSON(json: string): Page {
    const parsedObj = JSON.parse(json);
    const page = new Page(parsedObj.page_id);
    page.location = parsedObj.page_location;
    page.view = parsedObj.view_information;

    if (parsedObj.page_steps) {
      parsedObj.page_steps.forEach((s: any) => {
        page.addStep(Step.fromJSON(JSON.stringify(s)));
      });
    }
    return page;
  }
}
