export enum StepType {
  Click = 'clicked',
  Input = 'input',
  KeyPress = 'keypress',
  Unknown = 'unknown',
}

export type Key = {
  key: string;
  keyCode: number;
};

export interface Stringify {
  toString(): string;
}

export interface Equals {
  equalsTo(other: Step): boolean;
}

export class TestScenario implements Stringify {
  private scenario_id: string;
  private created: number;
  private edited: number;
  private pages: Page[];
  private scenario_name: string;

  constructor(id: string, timestamp?: number) {
    this.created = timestamp || -1;
    this.edited = timestamp || -1;
    this.pages = [];
    this.scenario_id = id;
    this.scenario_name = '';
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

  toString(): string {
    return JSON.stringify(this);
  }

  public static fromJSON(json: string): TestScenario {
    const parsedObj = JSON.parse(json);
    const testScen = new TestScenario(parsedObj.scenario_id, parsedObj.created);
    testScen.latestEdit = parsedObj.edited;
    testScen.name = parsedObj.scenario_name;

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
        page.addStep(Page.stepFromJSON(JSON.stringify(s)));
      });
    }
    return page;
  }

  private static stepFromJSON(json: string): Step {
    const parsedObj = JSON.parse(json);
    switch (parsedObj.action_type) {
      case StepType.Click:
        const cs = new ClickStep();
        cs.controlId = parsedObj.control_id;
        cs.controlType = parsedObj.control_type;
        cs.styleClasses = parsedObj.style_classes;
        cs.actionLoc = parsedObj.action_location;
        cs.useControlId = parsedObj.use_control_id;
        cs.controlAttributes = parsedObj.control_attributes;
        return cs;
      case StepType.Input:
        const is = new InputStep();
        is.controlId = parsedObj.control_id;
        is.controlType = parsedObj.control_type;
        is.styleClasses = parsedObj.style_classes;
        is.actionLoc = parsedObj.action_location;
        is.useControlId = parsedObj.use_control_id;
        is.controlAttributes = parsedObj.control_attributes;
        if (parsedObj.keys) {
          parsedObj.keys.forEach((k: any) => {
            is.addStep(Page.stepFromJSON(JSON.stringify(k)) as KeyPressStep);
          });
        }
        return is;
      case StepType.KeyPress:
        const kps = new KeyPressStep();
        kps.controlId = parsedObj.control_id;
        kps.controlType = parsedObj.control_type;
        kps.styleClasses = parsedObj.style_classes;
        kps.actionLoc = parsedObj.action_location;
        kps.useControlId = parsedObj.use_control_id;
        kps.key = parsedObj.key_char;
        kps.keyCode = parsedObj.key_code;
        kps.controlAttributes = parsedObj.control_attributes;
        return kps;
      default:
        return new UnknownStep();
    }
  }
}

export abstract class Step implements Stringify, Equals {
  private action_type: StepType;
  private action_location: string;

  private control_id: string;
  private use_control_id: boolean;
  private control_type: string;
  private style_classes: string[];
  private control_attributes: { name: string; value: any; use: boolean }[];

  constructor(type: StepType) {
    this.action_type = type;
    this.control_id = '';
    this.style_classes = [];
    this.action_location = '';
    this.control_type = '';
    this.control_attributes = [];
    this.use_control_id = false;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  equalsTo(other: Step): boolean {
    return (
      this.controlId.trim() === other.controlId.trim() &&
      this.actionLoc.trim() === other.actionLoc.trim()
    );
  }

  addStyleClass(cls: string): void {
    this.style_classes.push(cls);
  }

  public get useControlId(): boolean {
    return this.use_control_id;
  }
  public set useControlId(value: boolean) {
    this.use_control_id = value;
  }

  get actionType(): StepType {
    return this.action_type;
  }

  set actionType(type: StepType) {
    this.action_type = type;
  }

  set controlId(id: string) {
    this.control_id = id;
    if (!id.startsWith('__')) {
      this.useControlId = true;
    }
  }

  get controlId(): string {
    return this.control_id;
  }

  set styleClasses(classes: string[]) {
    this.style_classes = classes;
  }

  get styleClasses(): string[] {
    return this.style_classes.filter((sc) => sc !== 'injectClass');
  }

  set actionLoc(loc: string) {
    this.action_location = loc;
  }

  get actionLoc(): string {
    return this.action_location;
  }

  set controlType(type: string) {
    this.control_type = type;
  }

  get controlType(): string {
    return this.control_type;
  }

  set controlAttributes(
    attributes: { name: string; value: any; use: boolean }[]
  ) {
    this.control_attributes = attributes;
  }

  get controlAttributes(): { name: string; value: any; use: boolean }[] {
    return this.control_attributes;
  }
}

export class ClickStep extends Step {
  constructor() {
    super(StepType.Click);
  }
}

export class KeyPressStep extends Step {
  private key_char: string;
  private key_code: number;

  constructor(k?: string, c?: number) {
    super(StepType.KeyPress);
    this.key_char = k || '';
    this.key_code = c || -1;
  }

  set key(s: string) {
    this.key_char = s;
  }

  get key(): string {
    return this.key_char;
  }

  set keyCode(c: number) {
    this.key_code = c;
  }

  get keyCode(): number {
    return this.key_code;
  }
}

export class InputStep extends Step {
  private keys: KeyPressStep[];

  constructor() {
    super(StepType.Input);
    this.keys = [];
  }

  get steps(): KeyPressStep[] {
    return this.keys;
  }

  public addStep(step: KeyPressStep) {
    this.keys.push(step);
  }

  public getResultText(): string {
    const sb: string[] = [];
    this.keys.forEach((k) => {
      if (k.keyCode !== 20 && k.keyCode !== 8) {
        sb.push(k.key || '');
      } else if (k.keyCode === 8) {
        sb.pop();
      }
    });
    return sb.join('');
  }
}

export class UnknownStep extends Step {
  constructor() {
    super(StepType.Unknown);
  }
}
