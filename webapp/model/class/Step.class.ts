import { StepType } from "../enum/StepType"

export type RecordEvent = {
    type: StepType,
    key?: string,
    keyCode?: number,
    control: {
        id: string,
        type: string,
        classes: string[],
        properties: {
            name: string,
            value: unknown,
            use: boolean
        }[],
        bindings: {
            propertyName: string,
            use: boolean,
            bindingValue?: unknown,
            modelPath?: string,
            propertyPath?: string,
            modelName?: string,
            i18n?: boolean,
            key?: string,
            model?: string,
        }[],
        view: {
            absoluteViewName: string,
            relativeViewName: string
        },
        events: {
            press: boolean
        },
        recordReplaySelector: Record<string, unknown>
    },
    location: string
}

export type Control = {
    controlId: { id: string; use: boolean };
    type: string;
    properties?: {
        name: string;
        value: unknown;
        use: boolean;
        hideFromSelection?: boolean;
    }[];
    bindings?: {
        propertyName?: string;
        bindingValue?: string | number | boolean;
        modelPath?: string;
        propertyPath?: string;
        modelName: string;
        contextPath?: string;
        use: boolean;
    }[];
    i18nTexts?: {
        propertyName: string;
        propertyPath: string;
        bindingValue: unknown;
        use: boolean;
    }[];
};

export type ViewInformation = {
    absoluteViewName: string;
    relativeViewName: string;
}

export abstract class Step {
    private _id: string;
    private _actionType: StepType;
    private _actionLocation: string;
    private _styleClasses: string[];
    private _viewInfo: ViewInformation;
    private _control: Control;
    private _recordReplaySelector: Record<string, unknown>;
    private _comment: string;

    public static recordEventToStep(event: RecordEvent): Step {
        let res: Step;
        switch (event.type) {
            case StepType.CLICK:
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
            case StepType.KEYPRESS:
                res = new KeyPressStep();
                (res as KeyPressStep).key = event.key;
                (res as KeyPressStep).keyCode = event.keyCode;
                break;
            default:
                res = new UnknownStep();
        }

        const stepControl: Control = {
            controlId: {
                id: (event.control?.id) || '',
                use: event.control.id.startsWith('__') ? false : true,
            },
            type: event.control.type,
        };
        stepControl.properties = Object.entries(event.control.properties).map(
            (entry) => ({ name: entry[0], value: entry[1], use: false })
        );

        event.control.bindings?.forEach((binding: Record<string, unknown>) => {
            if (binding.i18n) {
                if (!stepControl.i18nTexts) {
                    stepControl.i18nTexts = [];
                }
                stepControl.i18nTexts.push({
                    propertyName: binding.key as string,
                    propertyPath: binding.propertyPath as string,
                    bindingValue: binding.value,
                    use: false,
                });
            } else {
                if (!stepControl.bindings) {
                    stepControl.bindings = [];
                }
                stepControl.bindings.push({
                    contextPath: binding.contextPath as string,
                    propertyName: binding.key as string,
                    bindingValue: binding.value as string | number | boolean,
                    modelPath: binding.modelPath as string,
                    propertyPath: binding.propertyPath as string,
                    modelName: binding.model as string,
                    use: false,
                });
            }
        });
        res.control = stepControl;
        res.styleClasses = event.control.classes;
        res.actionLocation = event.location;
        res.viewInfos = event.control.view;
        res.recordReplaySelector = event.control.recordReplaySelector;
        res.applyPreSelection();
        return res;
    }
    public static fromObject(object: Partial<Step>): Step {
        const stepControl: Control = Object.assign({}, object.control);
        let step: Step;
        switch (object.actionType) {
            case StepType.VALIDATION:
                step = new ValidationStep(object.id);
                break;
            case StepType.CLICK:
                step = new ClickStep(object.id);
                break;
            case StepType.INPUT:
                step = new InputStep(object.id);
                if ((object as Partial<InputStep>).keys) {
                    (object as Partial<InputStep>).keys.forEach((k: KeyPressStep) => {
                        (step as InputStep).addStep(Step.fromObject(k) as KeyPressStep);
                    });
                }
                break;
            case StepType.KEYPRESS:
                step = new KeyPressStep(object.id);
                (step as KeyPressStep).key = (object as Partial<KeyPressStep>).key;
                (step as KeyPressStep).keyCode = (object as Partial<KeyPressStep>).keyCode;
                break;
            default:
                step = new UnknownStep(object.id);
        }
        step.styleClasses = object.styleClasses;
        step.actionLocation = object.actionLocation;
        step.recordReplaySelector = object.recordReplaySelector;
        step.viewInfos = object.viewInfos;
        step.control = stepControl;
        step.comment = object.comment || '';
        return step;
    }

    constructor(type: StepType, step_id?: string) {
        if (step_id) {
            this._id = step_id;
        } else {
            this._id = crypto.randomUUID();
        }
        this.actionType = type;
        this.styleClasses = [];
        this.actionLocation = '';
        this.recordReplaySelector = {};
        this.control = {
            controlId: { id: '', use: false },
            type: '',
        };
    }

    public get id(): string {
        return this._id;
    }

    public get actionType(): StepType {
        return this._actionType;
    }

    public set actionType(value: StepType) {
        this._actionType = value;
    }

    public get actionLocation(): string {
        return this._actionLocation;
    }

    public set actionLocation(value: string) {
        this._actionLocation = value;
    }

    public get control(): Control {
        return this._control;
    }

    public set control(value: Control) {
        this._control = value;
    }

    public get styleClasses(): string[] {
        return this._styleClasses;
    }

    public set styleClasses(value: string[]) {
        this._styleClasses = value;
    }

    public get viewInfos(): ViewInformation {
        return this._viewInfo;
    }

    public set viewInfos(value: ViewInformation) {
        this._viewInfo = value;
    }

    public get recordReplaySelector(): Record<string, unknown> {
        return this._recordReplaySelector;
    }

    public set recordReplaySelector(value: Record<string, unknown>) {
        this._recordReplaySelector = value;
    }

    public get comment(): string {
        return this._comment;
    }

    public set comment(comment: string) {
        this._comment = comment;
    }

    getObject(): Record<string, unknown> {
        return {
            id: this.id,
            actionType: this.actionType,
            actionLocation: this.actionLocation,
            control: this.control,
            styleClasses: this.styleClasses,
            recordReplaySelector: this.recordReplaySelector,
            viewInfos: this.viewInfos,
            comment: this.comment
        }
    }

    equalsTo(other: Step): boolean {
        return (
            this.id.trim() === other.id.trim() &&
            this.actionLocation.trim() === other.actionLocation.trim()
        );
    }

    addStyleClass(cls: string): void {
        this.styleClasses.push(cls);
    }

    applyPreSelection() {
        if (this.recordReplaySelector['id']) {
            this.control.controlId.use = true;
            return;
        }

        if (this.recordReplaySelector['properties']) {
            const props = this.recordReplaySelector['properties'];
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
                if (b.propertyPath === (path as { propertyPath: string }).propertyPath) {
                    b.use = true;
                }
            });
        }

        if (this.recordReplaySelector['i18NText']) {
            const propName = (this.recordReplaySelector['i18NText'] as { propertyName: string }).propertyName;
            this.control.i18nTexts?.forEach((it) => {
                if (it.propertyName === propName) {
                    it.use = true;
                }
            });
        }
    }

    set controlBindings(
        bindings: {
            propertyName: string;
            bindingValue: string | number | boolean;
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
        bindingValue: unknown;
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
            bindingValue: unknown;
            use: boolean;
        }[]
    ) {
        this.control.i18nTexts = texts;
    }

    get controlI18nTexts(): {
        propertyName: string;
        propertyPath: string;
        bindingValue: unknown;
        use: boolean;
    }[] {
        if (this.control.i18nTexts) {
            return this.control.i18nTexts;
        } else {
            return [];
        }
    }

    get namespace(): string {
        return this.viewInfos?.absoluteViewName
            .replace(`.${this.viewInfos?.relativeViewName}`, '')
            .replace('.view', '')
            .trim() || '';
    }
}

export class ClickStep extends Step {
    constructor(step_id?: string) {
        super(StepType.CLICK, step_id);
    }
}

export class ValidationStep extends Step {
    constructor(step_id?: string) {
        super(StepType.VALIDATION, step_id);
    }
}

export class KeyPressStep extends Step {
    private key_char: string;
    private key_code: number;

    constructor(k?: string, c?: number, step_id?: string) {
        if (k && k.length > 1) {
            super(StepType.KEYPRESS, k);
        } else {
            super(StepType.KEYPRESS, step_id);
        }
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

    getObject(): Record<string, unknown> {
        const original = super.getObject();
        original.keyCode = this.key_code;
        original.key = this.key_char;
        return original;
    }
}

export class InputStep extends Step {
    private _keys: KeyPressStep[];

    constructor(id?: string) {
        super(StepType.INPUT, id);
        this._keys = [];
    }

    get keys(): KeyPressStep[] {
        return this._keys;
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

    getObject(): Record<string, unknown> {
        const original = super.getObject();
        original.keys = this._keys.map(k => k.getObject());
        return original;
    }
}

export class UnknownStep extends Step {
    constructor(id?: string) {
        super(StepType.UNKNOWN, id);
    }
}
