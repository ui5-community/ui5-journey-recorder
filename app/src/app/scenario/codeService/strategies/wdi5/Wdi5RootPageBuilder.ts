import StringBuilder from 'src/app/classes/StringBuilder';
import { Page } from 'src/app/classes/testScenario';
import Wdi5CodePageBuilderInterface from './Wdi5PageBuilder';

export default class Wdi5RootPageBuilder extends Wdi5CodePageBuilderInterface {
  constructor() {
    super(new Page('Page'));
  }

  generate(): string {
    const p = new StringBuilder();
    p.add(`const { wdi5 } = require("wdio-ui5-service");`).addNewLine();
    p.add(`module.exports = class Page {`).addNewLine();
    p.addTab().add(`async open(path) {`).addNewLine();
    p.addTab(2).add(`wdi5.goTo(path)`).addNewLine();
    p.addTab().add(`}`).addNewLine();
    p.add(`};`);
    return p.toString();
  }
}
