import StringBuilder from 'src/app/classes/StringBuilder';
import { Page } from 'src/app/classes/testScenario';
import { PageBuilder } from './PageBuilder';

export default class ViewPageBuilder extends PageBuilder {
  private _page: Page;

  constructor(page: Page) {
    super('', '', '');
    this._page = page;
    this._namespace = '<namespace>';
    this._createBaseSetup();
  }

  public generate(): string {
    var code = new StringBuilder();
    code.addBuilder(this._generateDependencies());

    code.addTab().add('"use strict";').addNewLine(2);

    code.addBuilder(this._generatePageOpener());

    const renderActions =
      Object.values(this._actions).filter((a) => a.render).length !== 0;
    if (renderActions) {
      code.add(',').addNewLine();
      code.addBuilder(this._generateActions());
    }

    const renderAssertions =
      Object.values(this._assertions).filter((a) => a.render).length !== 0;
    if (renderAssertions) {
      code.add(',').addNewLine();
      code.addBuilder(this._generateAssertions());
    }
    code.addNewLine();
    code.addBuilder(this._generatePageClose());

    code.add('});');

    return code.toString();
  }

  private _createBaseSetup() {
    this._viewName = this._page.view.relativeViewName || this._viewName;
    const posNamespace = this._page.view.absoluteViewName
      .replace(`.${this._page.view.relativeViewName}`, '')
      .replace('.view', '')
      .trim();
    this._namespace = posNamespace || this._namespace;

    this._dependencies.push({
      asyncDep: `${this._namespace}/<testPath>/CommonPage`,
      paramDep: 'CommonPage',
    });
  }

  private _generateDependencies(): StringBuilder {
    var dependencies = new StringBuilder('sap.ui.define([').addNewLine();

    this._dependencies.forEach((d) => {
      dependencies.addTab().add(`"${d.asyncDep}"`);
      dependencies.add(',').addNewLine();
    });
    dependencies.remove(2);
    dependencies.addNewLine();
    dependencies.add('], function(');
    this._dependencies.forEach((d) => {
      dependencies.add(d.paramDep);
      dependencies.add(', ');
    });
    dependencies.remove();
    dependencies.add('){').addNewLine();
    return dependencies;
  }

  private _generatePageOpener(): StringBuilder {
    const opener = new StringBuilder();
    opener.addTab().add('Opa5.createPageObjects({').addNewLine();
    opener.addTab(2).add(`on${this._viewName}: {`).addNewLine();
    opener.addTab(3).add(`baseClass: CommonPage,`).addNewLine();
    opener.addTab(3).add(`viewName: "${this._viewName}"`);
    return opener;
  }

  private _generateActions(): StringBuilder {
    const actions = new StringBuilder();
    actions.addTab(3).add('actions: {').addNewLine();
    if (this._actions['press'].render) {
      actions.addBuilder(this._generatePressFunction());
    }
    if (this._actions['press'].render && this._actions['enterText'].render) {
      actions.remove();
      actions.add(',').addNewLine();
    }
    if (this._actions['enterText'].render) {
      actions.addBuilder(this._generateEnterTextFunction());
    }
    actions.addTab(3).add('}');
    return actions;
  }

  private _generateAssertions(): StringBuilder {
    const assertions = new StringBuilder();
    assertions.addTab(3).add('assertions: {').addNewLine();
    if (this._assertions['exists']?.render) {
      assertions.addBuilder(this._generateValidateFunction());
    }
    //@TODO: extend to get all the assertions
    assertions.addTab(3).add('}');
    return assertions;
  }

  private _generatePageClose(): StringBuilder {
    const closing = new StringBuilder();
    closing.addTab(2).add('}').addNewLine();
    closing.addTab().add('});').addNewLine();
    return closing;
  }

  private _generatePressFunction(): StringBuilder {
    var click = new StringBuilder();
    click.addTab(4).add('pressOn: function(oActionProperties) {').addNewLine();
    click.addTab(5).add('return this.press(oActionProperties, {').addNewLine();
    click.addTab(6).add('success: function() {').addNewLine();
    click
      .addTab(7)
      .add(
        `Opa5.assert.ok(true, "Could click the control at view ${this._viewName}");`
      )
      .addNewLine();
    click.addTab(6).add('},').addNewLine();
    click
      .addTab(6)
      .add(
        `errorMessage: "Won't be able to click the control at the view '${this._viewName}' with requirements: " + JSON.stringify(oActionProperties)`
      )
      .addNewLine();
    click.addTab(5).add('});').addNewLine();
    click.addTab(4).add('}').addNewLine();
    return click;
  }

  private _generateEnterTextFunction(): StringBuilder {
    var click = new StringBuilder();
    click
      .addTab(4)
      .add('inputTextInto: function(oActionProperties) {')
      .addNewLine();
    click
      .addTab(5)
      .add('return this.enterText(oActionProperties, {')
      .addNewLine();
    click.addTab(6).add('success: function() {').addNewLine();
    click
      .addTab(7)
      .add(
        `Opa5.assert.ok(true, "Could enter text at the control at view ${this._viewName}");`
      )
      .addNewLine();
    click.addTab(6).add('},').addNewLine();
    click
      .addTab(6)
      .add(
        `errorMessage: "Won't be able to enter text at the control at the view '${this._viewName}' with requirements: " + JSON.stringify(oActionProperties)`
      )
      .addNewLine();
    click.addTab(5).add('});').addNewLine();
    click.addTab(4).add('}').addNewLine();
    return click;
  }

  private _generateValidateFunction(): StringBuilder {
    var click = new StringBuilder();
    click
      .addTab(4)
      .add('thereShouldBe: function(oAssertionProperties) {')
      .addNewLine();
    click
      .addTab(5)
      .add('return this.thereShouldBe(oAssertionProperties, {')
      .addNewLine();
    click.addTab(6).add('success: function() {').addNewLine();
    click
      .addTab(7)
      .add(
        `Opa5.assert.ok(true, "Found the control at view ${this._viewName}");`
      )
      .addNewLine();
    click.addTab(6).add('},').addNewLine();
    click
      .addTab(6)
      .add(
        `errorMessage: "Won't be able to find the control at the view '${this._viewName}' with requirements: " + JSON.stringify(oAssertionProperties)`
      )
      .addNewLine();
    click.addTab(5).add('});').addNewLine();
    click.addTab(4).add('}').addNewLine();
    return click;
  }
}
