import Journey from "../model/class/Journey.class";
import { ClickStep, InputStep, KeyPressStep, Step, UnknownStep, ValidationStep } from "../model/class/Step.class";
import { StepType } from "../model/enum/StepType";

export default class JourneyStorageService {
    private static instance: JourneyStorageService;
    private static readonly STOREPATH = 'journeys';
    private _journeyCache: Record<string, Journey> = {};

    private constructor() { }

    public static getInstance(): JourneyStorageService {
        if (!JourneyStorageService.instance) {
            JourneyStorageService.instance = new JourneyStorageService();
        }
        return JourneyStorageService.instance;
    }

    public static createJourneyFromRecording(recording: Partial<Journey>): Journey {
        const journey = new Journey(crypto.randomUUID(), Date.now());
        const steps = recording.steps;
        delete recording.steps;
        Object.assign(journey, recording)

        //TODO(@tabris87): Issue #71 here we have to transform the click on an input followed by keypresses into an input step.
        const stepList = this._transformToList(
            this._reduceSteps(steps)
        );

        stepList.forEach((s: Step) => {
            journey.addStep(s);
        })
        JourneyStorageService.getInstance()._journeyCache[journey.id] = journey;
        return journey;
    }

    public static async isChanged(journey: Journey): Promise<boolean> {
        // if the journey is unsuccessfull we can just return
        if (!journey.id && !journey.startUrl) {
            return false;
        }
        const storageData: Record<string, string> = await chrome.storage.local.get(journey.id) as Record<string, string>;
        if (Object.keys(storageData).length === 0) {
            return true;
        }
        const storageJourney = Journey.fromJSON(Object.values(storageData)[0]);
        return !journey.equals(storageJourney);
    }

    public async getById(id: string): Promise<Journey | null> {
        if (!id) {
            return null;
        }
        if (this._journeyCache[id]) {
            return this._journeyCache[id];
        } else {
            const storageData: Record<string, string> = await chrome.storage.local.get(id) as Record<string, string>;
            if (Object.keys(storageData).length === 0) {
                return null;
            }
            const journey = Journey.fromJSON(Object.values(storageData)[0]);
            this._journeyCache[journey.id] = journey;
            return journey;
        }
    }

    public async getStepById(oIds: { journeyId: string, stepId: string }) {
        const journey = await this.getById(oIds.journeyId);
        return journey.steps.find((s: Step) => s.id === oIds.stepId);
    }

    public async save(entity: Journey): Promise<void> {
        try {
            const ids: string[] = await this.getIdList();
            if (!ids.find((id: string) => id === entity.id)) {
                //create scenario
                ids.push(entity.id);
                await this.storeIdList(ids)
                await this.storeEntity(entity);
            } else {
                //update scenario
                await this.storeEntity(entity);
            }
        } catch (_: unknown) {
            await this.storeIdList([entity.id]);
            await this.storeEntity(entity);
        }
        this._journeyCache[entity.id] = entity;
    }

    public async getAll(): Promise<Journey[]> {
        try {
            const ids: string[] = await this.getIdList();
            const storageData: Record<string, string> = await chrome.storage.local.get(ids) as Record<string, string>;
            if (storageData) {
                const journeys = Object.values(storageData).map((d: string) => {
                    const journey = Journey.fromJSON(d);
                    this._journeyCache[journey.id] = journey;
                    return journey;
                });
                return journeys;
            } else {
                return Object.keys(this._journeyCache).length > 0 ? Object.values(this._journeyCache) : [];
            }
        }
        catch (_: unknown) {
            return [];
        }
    }

    public async deleteJourney(entity: Journey): Promise<void> {
        const journeyId = entity.id;
        let ids = await this.getIdList();
        ids = ids.filter((id) => id !== journeyId);
        await this.removeEntity(journeyId);
        delete this._journeyCache[journeyId];
        return this.storeIdList(ids);
    }

    private async getIdList(): Promise<string[]> {
        const items: Record<string, string[]> = await chrome.storage.local.get([JourneyStorageService.STOREPATH]);
        const itemIds = items[JourneyStorageService.STOREPATH];
        if (itemIds) {
            return itemIds;
        } else {
            throw Error();
        }
    }

    private async storeIdList(ids: string[]): Promise<void> {
        const scenList: Record<string, string[]> = {};
        scenList[JourneyStorageService.STOREPATH] = ids;
        await chrome.storage.local.set(scenList);
    }

    private async storeEntity(entity: Journey): Promise<void> {
        const storage: Record<string, string> = {};
        storage[entity.id] = entity.toString();
        await chrome.storage.local.set(storage);
    }

    private async removeEntity(entityId: string): Promise<void> {
        await chrome.storage.local.remove(entityId);
    }

    private static _transformToList(steps: Step[][]): Step[] {
        return steps.map((el) => {
            let res: Step = new UnknownStep();
            if (el.length === 1) {
                res = el[0];
            } else {
                if (el.length !== 0) {
                    res = this._transformToTypings(el);
                }
            }
            return res;
        });
    }

    private static _transformToTypings(parts: Step[]): Step {
        const inputStep = parts.reduce((a: InputStep, b: Step) => {
            if (b instanceof KeyPressStep) {
                a.addStep(b);
            } else if (b instanceof ClickStep || b instanceof ValidationStep) {
                a.actionLocation = b.actionLocation;
                a.styleClasses = b.styleClasses;
                a.recordReplaySelector = b.recordReplaySelector;
                a.control = b.control;
            }
            return a;
        }, new InputStep());
        inputStep.applyPreSelection();
        const viewInfos = parts[0]
            ? parts[0].viewInfos
            : { absoluteViewName: '', relativeViewName: '' };
        inputStep.viewInfos = viewInfos;
        return inputStep;
    }

    private static _reduceSteps(steps: Step[]): Step[][] {
        return steps.reduce(
            (a: Step[][], b: Step): Step[][] => {
                const el = a.pop();
                if (!el) {
                    a.push([b]);
                } else {
                    if (el[0].control.controlId.id === b.control.controlId.id && b.actionType === StepType.KEYPRESS) {
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
}