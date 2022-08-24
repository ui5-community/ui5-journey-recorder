import { TestScenario } from '../../classes/testScenario';

export class ScenarioStorageService {
  private _path: string;
  constructor() {
    this._path = 'scenarios';
  }

  public getById(id: string): Promise<TestScenario> {
    return chrome.storage.local
      .get(id)
      .then((data: { [key: string]: string }) => {
        return TestScenario.fromJSON(data[Object.keys(data)[0]]);
      });
  }

  public save(entity: TestScenario): Promise<void> {
    return this.getIdList()
      .then((ids: string[]) => {
        if (
          !ids.find((id) => {
            return id === entity.id;
          })
        ) {
          //create scenario
          ids.push(entity.id);
          return this.storeIdList(ids).then(() => {
            return this.storeEntity(entity);
          });
        } else {
          //update scenario
          return this.storeEntity(entity);
        }
      })
      .catch(() => {
        return this.storeIdList([entity.id]).then(() => {
          return this.storeEntity(entity);
        });
      });
  }

  public getAll(): Promise<TestScenario[]> {
    return this.getIdList()
      .then((ids: string[]) => {
        return chrome.storage.local
          .get(ids)
          .then((data: { [key: string]: string }) => {
            if (data) {
              return Object.values(data).map((d) => TestScenario.fromJSON(d));
            } else {
              return [];
            }
          });
      })
      .catch(() => {
        return [];
      });
  }

  private getIdList(): Promise<string[]> {
    return chrome.storage.local
      .get([this._path])
      .then((items: { [key: string]: string[] }) => {
        const itemIds = items['scenarios'];
        if (itemIds) {
          return itemIds;
        } else {
          throw Error();
        }
      });
  }

  private storeIdList(ids: string[]): Promise<void> {
    const scenList: { [key: string]: string[] } = {};
    scenList[this._path] = ids;
    return chrome.storage.local.set(scenList);
  }

  private storeEntity(entity: TestScenario): Promise<void> {
    const storage: { [key: string]: string } = {};
    storage[entity.id] = entity.toString();
    return chrome.storage.local.set(storage);
  }
}
