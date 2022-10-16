import StringBuilder from 'src/app/classes/StringBuilder';
import { Page } from 'src/app/classes/testScenario';
import Wdi5CodeStrategy from './Wdi5CodeStrategy';
import Wdi5IPageBuilder from './Wdi5IPageBuilder';
import Wdi5SingleStepStrategy from './Wdi5SingleStepStrategy';

export default class Wdi5PageBuilder extends Wdi5IPageBuilder {
  pageName: string;
  hashPath: string;
  constructor(page: Page, pageName: string, hashPath: string) {
    super(page); // -> this._page
    this.pageName = pageName;
    this.hashPath = hashPath;
  }

  generate(): string {
    const p = new StringBuilder();
    p.add(`const { wdi5 } = require("wdio-ui5-service");`).addNewLine();
    p.add(`module.exports = class ${this.pageName} {`).addNewLine();

    p.add(this._generateOpenMethod());

    p.addTab().add(`async journey() {`).addNewLine();
    this._generateJourneySteps().forEach((stepCode) => {
      p.add(stepCode);
      p.addNewLine();
    });
    p.addTab().add(`}`).addNewLine();

    p.add(`};`);
    return p.toString();
  }

  _generateJourneySteps(): string[] {
    const stepCodes = this._page.steps.map((step) => {
      return new Wdi5CodeStrategy().generateStepCode(step, 2);
    });
    return stepCodes;
  }

  _generateOpenMethod(): string {
    const p = new StringBuilder();
    p.addTab().add(`async open("${this.hashPath}") {`).addNewLine();
    p.addTab(2).add(`wdi5.goTo("${this.hashPath}")`).addNewLine();
    p.addTab().add(`}`).addNewLine();
    return p.toString();
  }
}
