import Journey from "../model/class/Journey.class";
import { Step } from "../model/class/Step.class";

export default class JourneyStorageService {
    private static instance: JourneyStorageService;
    private static storePath = 'scenarios';

    private constructor() { }

    public static getInstance(): JourneyStorageService {
        if (!JourneyStorageService.instance) {
            JourneyStorageService.instance = new JourneyStorageService();
        }
        return JourneyStorageService.instance;
    }

    public async getById(id: string): Promise<Journey> {
        const storageData: Record<string, string> = await chrome.storage.local.get(id) as Record<string, string>;
        if (Object.keys(storageData).length === 0) {
            return null;
        }
        return Journey.fromJSON(Object.values(storageData)[0]);
    }

    public async getStepById(oIds: { journeyId: string, stepId: string }) {
        const journey = await this.getById(oIds.journeyId);
        return journey.steps.find((s: Step) => s.id);
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
    }

    public async getAll(): Promise<Journey[]> {
        try {
            const ids: string[] = await this.getIdList();
            const storageData: Record<string, string> = await chrome.storage.local.get(ids) as Record<string, string>;
            if (storageData) {
                return Object.values(storageData).map((d: string) => Journey.fromJSON(d));
            } else {
                return [];
            }
        }
        catch (_: unknown) {
            return [];
        }
    }

    public async deleteJourney(entity: Journey): Promise<void> {
        const scenarioId = entity.id;
        let ids = await this.getIdList();
        ids = ids.filter((id) => id !== scenarioId);
        await this.removeEntity(scenarioId);
        return this.storeIdList(ids);
    }

    private async getIdList(): Promise<string[]> {
        const items: Record<string, string[]> = await chrome.storage.local.get([JourneyStorageService.storePath]);
        const itemIds = items['scenarios'];
        if (itemIds) {
            return itemIds;
        } else {
            throw Error();
        }
    }

    private async storeIdList(ids: string[]): Promise<void> {
        const scenList: Record<string, string[]> = {};
        scenList[JourneyStorageService.storePath] = ids;
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
}