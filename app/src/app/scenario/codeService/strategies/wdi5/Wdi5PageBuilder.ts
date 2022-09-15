import { Page } from 'src/app/classes/testScenario';

export default abstract class Wdi5CodePageBuilder {
  private _page: Page;
  constructor(page: Page) {
    this._page = page;
  }
  public abstract generate(): string;
}
