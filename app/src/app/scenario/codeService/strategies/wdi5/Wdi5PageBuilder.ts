import StringBuilder from 'src/app/classes/StringBuilder';
import { Page } from 'src/app/classes/testScenario';
import Wdi5IPageBuilder from './Wdi5IPageBuilder';

export default class Wdi5PageBuilder extends Wdi5IPageBuilder {
  pageName: string;
  hashPath: string;
  constructor(pageName: string, hashPath: string) {
    super(new Page(pageName));
    this.pageName = pageName
    this.hashPath = hashPath
  }

  generate(): string {
    const p = new StringBuilder();
    p.add(`const { wdi5 } = require("wdio-ui5-service");`).addNewLine();
    p.add(`module.exports = class ${this.pageName} {`).addNewLine();
    p.addTab().add(`async open("${this.hashPath}") {`).addNewLine();
    p.addTab(2).add(`wdi5.goTo("${this.hashPath}")`).addNewLine();
    p.addTab().add(`}`).addNewLine();
    p.add(`};`);
    return p.toString();
  }
}
