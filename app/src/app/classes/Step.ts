import { Equals, Stringify } from './interfaces';

export enum StepType {
  Click = 'clicked',
  Input = 'input',
  KeyPress = 'keypress',
  Unknown = 'unknown',
  Validation = 'validate',
}

export type IntermediateStep = Step & {
  view?: { absoluteViewName: string; relativeViewName: string };
};

export type Control = {
  control_id: { id: string; use: boolean };
  control_type: string;
  properties?: {
    name: string;
    value: any;
    use: boolean;
    hideFromSelection?: boolean;
  }[];
  bindings?: {
    propertyName: string;
    bindingValue: any;
    modelPath: string;
    propertyPath: string;
    modelName: string;
    use: boolean;
  }[];
  i18nTexts?: {
    propertyName: string;
    propertyPath: string;
    bindingValue: any;
    use: boolean;
  }[];
};

export abstract class Step implements Stringify, Equals<Step> {
  private action_type: StepType;
  private action_location: string;
  private control: Control;
  private style_classes: string[];
  private record_replay_selector: { [key: string]: any };

  public static recordEventToStep(event: any): IntermediateStep {
    let res: IntermediateStep;
    switch (event.type) {
      case 'clicked':
        if (
          event.control &&
          event.control.events &&
          event.control.events.press
        ) {
          res = new ClickStep();
        } else {
          res = new ValidationStep();
        }
        break;
      case 'keypress':
        res = new KeyPressStep();
        break;
      default:
        res = new UnknownStep();
    }

    const stepControl: Control = {
      control_id: {
        id: event.control.id,
        use: event.control.id.startsWith('__') ? false : true,
      },
      control_type: event.control.type,
    };
    stepControl.properties = Object.entries(event.control.properties).map(
      (entry) => ({ name: entry[0], value: entry[1], use: false })
    );

    event.control.bindings?.forEach((binding: any) => {
      if (binding.i18n) {
        if (!stepControl.i18nTexts) {
          stepControl.i18nTexts = [];
        }
        stepControl.i18nTexts.push({
          propertyName: binding.key,
          propertyPath: binding.propertyPath,
          bindingValue: binding.value,
          use: false,
        });
      } else {
        if (!stepControl.bindings) {
          stepControl.bindings = [];
        }
        stepControl.bindings.push({
          propertyName: binding.key,
          bindingValue: binding.value,
          modelPath: binding.modelPath,
          propertyPath: binding.propertyPath,
          modelName: binding.model,
          use: false,
        });
      }
    });
    res.control = stepControl;
    res.style_classes = event.control.classes;
    res.action_location = event.location;
    res.view = event.control.view;
    res.record_replay_selector = event.control.recordReplaySelector;
    res.applyPreSelection();
    return res;
  }

  public static fromJSON(json: string): Step {
    const parsedObj = JSON.parse(json);
    const stepControl: Control = {
      control_id: {
        id: parsedObj.control.control_id.id,
        use: parsedObj.control.control_id.use,
      },
      control_type: parsedObj.control.control_type,
      properties: parsedObj.control.properties,
      bindings: parsedObj.control.bindings,
      i18nTexts: parsedObj.control.i18nTexts,
    };
    switch (parsedObj.action_type) {
      case StepType.Validation:
        const val = new ValidationStep();
        val.styleClasses = parsedObj.style_classes;
        val.actionLoc = parsedObj.action_location;
        val.recordReplaySelector = parsedObj.record_replay_selector;
        val.control = stepControl;
        return val;
      case StepType.Click:
        const cs = new ClickStep();
        cs.styleClasses = parsedObj.style_classes;
        cs.actionLoc = parsedObj.action_location;
        cs.recordReplaySelector = parsedObj.record_replay_selector;
        cs.control = stepControl;
        return cs;
      case StepType.Input:
        const is = new InputStep();
        is.styleClasses = parsedObj.style_classes;
        is.actionLoc = parsedObj.action_location;
        is.recordReplaySelector = parsedObj.record_replay_selector;
        is.control = stepControl;
        if (parsedObj.keys) {
          parsedObj.keys.forEach((k: any) => {
            is.addStep(Step.fromJSON(JSON.stringify(k)) as KeyPressStep);
          });
        }
        return is;
      case StepType.KeyPress:
        const kps = new KeyPressStep();
        kps.styleClasses = parsedObj.style_classes;
        kps.actionLoc = parsedObj.action_location;
        kps.key = parsedObj.key_char;
        kps.keyCode = parsedObj.key_code;
        kps.recordReplaySelector = parsedObj.record_replay_selector;
        kps.control = stepControl;
        return kps;
      default:
        return new UnknownStep();
    }
  }

  constructor(type: StepType) {
    this.action_type = type;
    this.style_classes = [];
    this.action_location = '';
    this.record_replay_selector = {};
    this.control = {
      control_id: { id: '', use: false },
      control_type: '',
    };
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

  applyPreSelection() {
    if (this.recordReplaySelector['id']) {
      this.control.control_id.use = true;
      return;
    }

    if (this.recordReplaySelector['properties']) {
      const props = this.record_replay_selector['properties'];
      Object.keys(props).forEach((k) => {
        const p = this.control.properties?.find((att) => att.name === k);
        if (p) {
          p.use = true;
        }
      });
    }

    if (this.recordReplaySelector['bindingPath']) {
      const path = this.recordReplaySelector['bindingPath'];
      this.control.bindings?.forEach((b) => {
        if (b.propertyPath === path.propertyPath) {
          b.use = true;
        }
      });
    }

    if (this.recordReplaySelector['i18nText']) {
      const propName = this.recordReplaySelector['i18nText'].propertyName;
      this.control.i18nTexts?.forEach((it) => {
        if (it.propertyName === propName) {
          it.use = true;
        }
      });
    }
    /*

    const copy = { ...this.recordReplaySelector };
    delete copy['id'];
    delete copy['properties'];
    delete copy['i18nText'];
    delete copy['bindingPath']; */
  }

  public get useControlId(): boolean {
    return this.control.control_id.use;
  }

  public set useControlId(value: boolean) {
    this.control.control_id.use = value;
  }

  get actionType(): StepType {
    return this.action_type;
  }

  set actionType(type: StepType) {
    this.action_type = type;
  }

  set controlId(id: string) {
    this.control.control_id = { id: id, use: false };
    if (!id.startsWith('__')) {
      this.control.control_id.use = true;
    }
  }

  get controlId(): string {
    return this.control.control_id.id;
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
    this.control.control_type = type;
  }

  get controlType(): string {
    return this.control.control_type;
  }

  set controlAttributes(
    attributes: { name: string; value: any; use: boolean }[]
  ) {
    this.control.properties = attributes;
  }

  get controlAttributes(): { name: string; value: any; use: boolean }[] {
    if (this.control.properties) {
      return this.control.properties;
    } else {
      return [];
    }
  }

  set controlBindings(
    bindings: {
      propertyName: string;
      bindingValue: any;
      modelPath: string;
      propertyPath: string;
      modelName: string;
      use: boolean;
    }[]
  ) {
    this.control.bindings = bindings;
  }

  get controlBindings(): {
    propertyName: string;
    bindingValue: any;
    modelPath: string;
    propertyPath: string;
    modelName: string;
    use: boolean;
  }[] {
    if (this.control.bindings) {
      return this.control.bindings;
    } else {
      return [];
    }
  }

  set controlI18nTexts(
    texts: {
      propertyName: string;
      propertyPath: string;
      bindingValue: any;
      use: boolean;
    }[]
  ) {
    this.control.i18nTexts = texts;
  }

  get controlI18nTexts(): {
    propertyName: string;
    propertyPath: string;
    bindingValue: any;
    use: boolean;
  }[] {
    if (this.control.i18nTexts) {
      return this.control.i18nTexts;
    } else {
      return [];
    }
  }

  set recordReplaySelector(selector: { [key: string]: any }) {
    this.record_replay_selector = selector;
  }

  get recordReplaySelector(): { [key: string]: any } {
    return this.record_replay_selector;
  }
}

export class ClickStep extends Step {
  constructor() {
    super(StepType.Click);
  }
}

export class ValidationStep extends Step {
  constructor() {
    super(StepType.Validation);
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
