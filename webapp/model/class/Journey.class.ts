import { StepType } from "../enum/StepType";
import { Control, Step, ViewInformation } from "./Step.class";

export default class Journey {
    private _id: string;
    private _created: number;
    private _edited: number;
    private _steps: Step[];
    private _name: string;
    private _ui5Version: string;

    constructor(id: string, timestamp?: number) {
        this._created = timestamp || -1;
        this._edited = timestamp || -1;
        this._steps = [];
        this._id = id;
        this._name = '';
        this._ui5Version = '';
    }

    public static fromObject(obj: Partial<Journey>): Journey {
        const journey = new Journey(obj.id, obj.created);
        journey.edited = obj.edited;
        journey.name = obj.name;
        journey.ui5Version = obj.ui5Version;
        if (obj.steps) {
            obj.steps.forEach((s: Partial<Step>) => {
                journey.addStep(Step.fromObject(s));
            });
        }
        return journey;
    }

    public static fromJSON(json: string): Journey {
        let parsedObj: Partial<Journey> = JSON.parse(json) as Partial<Journey>;
        if ((parsedObj as { pages: unknown }).pages) {
            parsedObj = Journey.fromJSONOldFormat(parsedObj);
        }
        const journey = new Journey(parsedObj.id, parsedObj.created);
        journey.edited = parsedObj.edited;
        journey.name = parsedObj.name;
        journey.ui5Version = parsedObj.ui5Version;
        if (parsedObj.steps) {
            parsedObj.steps.forEach((s: Partial<Step>) => {
                journey.addStep(Step.fromObject(s));
            });
        }
        return journey;
    }

    private static fromJSONOldFormat(old: Record<string, unknown>): Partial<Journey> {
        const steps: Partial<Step>[] = [];
        (old.pages as Record<string, unknown>[]).forEach((page: Record<string, unknown>) => {
            const viewInfos: ViewInformation = page.view_information as ViewInformation;
            (page.page_steps as Record<string, unknown>[]).forEach((step: Record<string, unknown>) => {
                steps.push({
                    id: step.step_id as string,
                    actionType: step.action_type as StepType,
                    actionLocation: step.action_location as string,
                    styleClasses: step.style_classes as string[],
                    viewInfos: viewInfos,
                    control: {
                        controlId: (step.control as Partial<Control> & { control_id: Control["controlId"] }).control_id,
                        type: (step.control as Partial<Control> & { control_type: Control["type"] }).control_type,
                        properties: (step.control as Partial<Control>).properties,
                        bindings: (step.control as Partial<Control>).bindings,
                        i18nTexts: (step.control as Partial<Control>).i18nTexts,
                    },
                    recordReplaySelector: step.record_replay_selector as Step["recordReplaySelector"]
                })
            });
        });
        return {
            id: old.scenario_id as string,
            created: old.created as number,
            edited: old.edited as number,
            name: old.scenario_name as string,
            ui5Version: old.ui5_version as string,
            steps: steps as Step[]
        };
    }

    public equals(other: Journey): boolean {
        return other.toString() === this.toString();
    }

    public addStep(step: Step): void {
        this._steps.push(step);
    }

    public updateStep(step: Step) {
        const index = this._steps.findIndex((ownStep: Step) => step.id === ownStep.id);
        this._steps[index] = step;
    }

    public toString(): string {
        return JSON.stringify({
            id: this.id,
            created: this.created,
            edited: this.edited,
            steps: this.steps.map((step: Step) => step.getObject()),
            name: this.name,
            ui5Version: this.ui5Version,
        })
    }

    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
    }

    public get created(): number {
        return this._created;
    }

    public set created(value: number) {
        this._created = value;
    }

    public get edited(): number {
        return this._edited;
    }

    public set edited(value: number) {
        this._edited = value;
    }

    public get steps(): Step[] {
        return this._steps;
    }

    public set steps(steps: Step[]) {
        if (!steps) {
            this._steps = [];
        }
        this._steps = steps;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get ui5Version(): string {
        return this._ui5Version;
    }

    public set ui5Version(value: string) {
        this._ui5Version = value;
    }

    public get startUrl(): string {
        return this.steps.length > 0 ? this.steps[0].actionLocation : '';
    }

    public get namespace(): string {
        return this.steps.length > 0 ? this.steps[0].namespace : '';
    }
}