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

  constructor(id: string, timestamp?: number) {
    this.created = timestamp || -1;
    this.edited = timestamp || -1;
    this.pages = [];
    this.scenario_id = id;
  }

  public addPage(p: Page) {
    this.pages.push(p);
  }

  get id(): string {
    return this.scenario_id;
  }

  get testPages(): Page[] {
    return this.pages;
  }

  get creationDate(): number {
    return this.created;
  }

  set lastEdit(le: number) {
    this.edited = le;
  }

  get latestEdit(): number {
    return this.edited;
  }

  toString(): string {
    return JSON.stringify(this);
  }
}

export class Page implements Stringify {
  private page_location: string = '';
  private page_steps: Step[] = [];

  toString(): string {
    return JSON.stringify(this);
  }

  set location(loc: string) {
    this.page_location = loc;
  }

  get location(): string {
    return this.page_location;
  }

  get steps(): Step[] {
    return this.page_steps;
  }

  public addStep(s: Step) {
    this.page_steps.push(s);
  }
}

export abstract class Step implements Stringify, Equals {
  private action_type: StepType;
  private control_id: string;
  private style_classes: string[];
  private action_location: string;

  constructor(type: StepType) {
    this.action_type = type;
    this.control_id = '';
    this.style_classes = [];
    this.action_location = '';
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

  get actionType(): StepType {
    return this.action_type;
  }

  set controlId(id: string) {
    this.control_id = id;
  }

  get controlId(): string {
    return this.control_id;
  }

  set styleClasses(classes: string[]) {
    this.style_classes = classes;
  }

  get styleClasses(): string[] {
    return this.style_classes;
  }

  set actionLoc(loc: string) {
    this.action_location = loc;
  }

  get actionLoc(): string {
    return this.action_location;
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
