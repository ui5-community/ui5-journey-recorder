import StringBuilder from 'src/app/classes/StringBuilder';
import { AdderOptions, PageBuilder } from './PageBuilder';

export default class CommonPageBuilder extends PageBuilder {
  private _bindMatcher: boolean;
  private _i18nMatcher: boolean;
  private _attMatcher: boolean;
  private _parentMatcher: boolean;
  private _aggEmptyMatcher: boolean;
  private _aggFilledMatcher: boolean;
  private _aggCountMatcher: boolean;
  private _pressAction: boolean;
  private _enterTextAction: boolean;

  constructor(namespace: string, viewName: string, baseClass: string) {
    super(namespace, viewName, baseClass);
    this._bindMatcher = false;
    this._i18nMatcher = false;
    this._attMatcher = false;
    this._parentMatcher = false;
    this._aggEmptyMatcher = false;
    this._aggFilledMatcher = false;
    this._aggCountMatcher = false;
    this._pressAction = false;
    this._enterTextAction = false;
  }

  override _adder(type: string, options: AdderOptions): this {
    this._bindMatcher = options['binding'] ? true : this._bindMatcher;
    this._i18nMatcher = options['i18n'] ? true : this._i18nMatcher;
    this._attMatcher = options['attribute'] ? true : this._attMatcher;
    this._parentMatcher =
      options && options['parent'] ? true : this._parentMatcher;

    this._aggEmptyMatcher =
      options && options['aggEmpty'] ? true : this._aggEmptyMatcher;
    this._aggFilledMatcher =
      options && options['aggFilled'] ? true : this._aggFilledMatcher;
    this._aggCountMatcher =
      options && options['aggCount'] ? true : this._aggCountMatcher;
    this._pressAction = options && options['press'] ? true : this._pressAction;
    this._enterTextAction =
      options && options['enterText'] ? true : this._enterTextAction;

    return super._adder(type, options);
  }

  public generate(): string {
    var oCode = new StringBuilder('sap.ui.define([').addNewLine();
    oCode.addBuilder(this._generateDependencies());
    oCode.addTab().add('"use strict";').addNewLine(2);
    oCode.addBuilder(this._addWrapParametersFunction());

    oCode
      .addTab()
      .add(
        'return Opa5.extend("' + this._namespace + '.<testPath>.CommonPage", {'
      )
      .addNewLine();
    oCode
      .addTab(2)
      .add('iStartTheAppByHash: function(oParameters) {')
      .addNewLine();
    oCode
      .addTab(3)
      .add('MockServer.init(_wrapParameters(oParameters || {}));')
      .addNewLine();
    oCode.addTab(3).add('this.iStartMyUIComponent({').addNewLine();
    oCode.addTab(4).add('componentConfig: {').addNewLine();
    oCode
      .addTab(5)
      .add('name: "' + this._namespace + '",')
      .addNewLine();
    oCode.addTab(5).add('async: true').addNewLine();
    oCode.addTab(4).add('},').addNewLine();
    oCode.addTab(4).add('hash: oParameters.hash').addNewLine();
    oCode.addTab(3).add('});').addNewLine();
    oCode.addTab(2).add('},').addNewLine(2);
    oCode.addTab(2).add('iTeardownTheApp: function() {').addNewLine();
    oCode.addTab(3).add('this.iTeardownMyUIComponent();').addNewLine();
    oCode.addTab(2).add('}');

    oCode.addBuilder(this._generateActionFunctions());
    oCode.addBuilder(this._generateAssertionFunctions());

    if (this._attMatcher) {
      oCode.add(',').addNewLine(2);
      oCode.addBuilder(this._addAttributeMatcherFunction());
    }

    oCode.addNewLine();
    oCode.addTab().add('});').addNewLine();
    oCode.add('});');
    return oCode.toString();
  }

  //#region matcher adding
  private _addBindingMatcherFunction(): string {
    var oFunctCode = new StringBuilder();
    oFunctCode
      .addTab(2)
      .add('_addBindingMatcher: function (aMatchers, aBindingInformations) {')
      .addNewLine();
    oFunctCode
      .addTab(3)
      .add('aBindingInformations.forEach(function (oBinding) {')
      .addNewLine();
    oFunctCode.addTab(4).add('var oBindObject = {};').addNewLine();
    oFunctCode.addTab(4).add('if (oBinding.model) {').addNewLine();
    oFunctCode
      .addTab(5)
      .add('oBindObject.modelName = oBinding.model;')
      .addNewLine();
    oFunctCode.addTab(4).add('}').addNewLine();
    oFunctCode.addTab(4).add('if (oBinding.path) {').addNewLine();
    oFunctCode.addTab(5).add('oBindObject.path = oBinding.path;').addNewLine();
    oFunctCode.addTab(4).add('}').addNewLine();
    oFunctCode.addTab(4).add('if (oBinding.propertyPath) {').addNewLine();
    oFunctCode
      .addTab(5)
      .add('oBindObject.propertyPath = oBinding.propertyPath;')
      .addNewLine();
    oFunctCode.addTab(4).add('}').addNewLine();
    oFunctCode
      .addTab(4)
      .add('aMatchers.push(new BindingPath(oBindObject));')
      .addNewLine();
    oFunctCode.addTab(3).add('});').addNewLine();
    oFunctCode.addTab(2).add('}');
    return oFunctCode.toString();
  }

  private _addI18NMatcherFunction(): string {
    var oFunctCode = new StringBuilder();
    oFunctCode
      .addTab(2)
      .add('_addI18NMatcher: function (aMatchers, aI18NInformations) {')
      .addNewLine();
    oFunctCode
      .addTab(3)
      .add('aI18NInformations.forEach(function (oBinding) {')
      .addNewLine();
    oFunctCode.addTab(4).add('var oBindObject = {};').addNewLine();
    oFunctCode.addTab(4).add('if (oBinding.key) {').addNewLine();
    oFunctCode
      .addTab(5)
      .add('oBindObject.modelName = oBinding.key;')
      .addNewLine();
    oFunctCode.addTab(4).add('}').addNewLine();
    oFunctCode.addTab(4).add('if (oBinding.propertyName) {').addNewLine();
    oFunctCode
      .addTab(5)
      .add('oBindObject.path = oBinding.propertyName;')
      .addNewLine();
    oFunctCode.addTab(4).add('}').addNewLine();
    oFunctCode.addTab(4).add('if (oBinding.parameters) {').addNewLine();
    oFunctCode
      .addTab(5)
      .add('oBindObject.propertyPath = oBinding.parameters;')
      .addNewLine();
    oFunctCode.addTab(4).add('}').addNewLine();
    oFunctCode
      .addTab(4)
      .add('aMatchers.push(new I18NText(oBindObject));')
      .addNewLine();
    oFunctCode.addTab(3).add('});').addNewLine();
    oFunctCode.addTab(2).add('}');
    return oFunctCode.toString();
  }

  private _addAttributeMatcherFunction(): StringBuilder {
    var oFunctCode = new StringBuilder();
    oFunctCode
      .addTab(2)
      .add(
        '_addAttributeMatcher: function (aMatchers, aAttributeInformations) {'
      )
      .addNewLine();
    oFunctCode
      .addTab(3)
      .add('aAttributeInformations.forEach(function (el) {')
      .addNewLine();
    oFunctCode
      .addTab(4)
      .add('aMatchers.push(new PropertyStrictEquals({')
      .addNewLine();
    oFunctCode.addTab(5).add('name: Object.keys(el)[0],').addNewLine();
    oFunctCode.addTab(5).add('value: Object.values(el)[0]').addNewLine();
    oFunctCode.addTab(4).add('}));').addNewLine();
    oFunctCode.addTab(3).add('});').addNewLine();
    oFunctCode.addTab(2).add('}');
    return oFunctCode;
  }
  //#endregion

  //#region general
  private _generateDependencies(): StringBuilder {
    var oDependencies = new StringBuilder();

    oDependencies.addTab().add('"sap/ui/test/Opa5",').addNewLine();
    oDependencies
      .addTab()
      .add('"')
      .add(this._namespace.replace(/\./g, '/'))
      .add('/<testPath>/MockServer"');

    if (this._bindMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/matcher/BindingPath"');
    }
    if (this._i18nMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/matcher/I18NText"');
    }
    if (this._attMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/matcher/PropertyStrictEquals"');
    }
    if (this._aggEmptyMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/matcher/AggregationEmpty"');
    }
    if (this._aggFilledMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/matcher/AggregationFilled"');
    }
    if (this._aggCountMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies
        .addTab()
        .add('"sap/ui/test/matcher/AggregationLengthEquals"');
    }
    if (this._enterTextAction) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/actions/EnterText"');
    }
    if (this._pressAction) {
      oDependencies.add(',').addNewLine();
      oDependencies.addTab().add('"sap/ui/test/actions/Press"');
    }
    if (this._parentMatcher) {
      oDependencies.add(',').addNewLine();
      oDependencies
        .addTab()
        .add('"')
        .add(this._namespace.replace(/\./g, '/'))
        .add('/<testPath>/customMatcher/ParentMatcher"');
    }

    oDependencies.addNewLine();
    oDependencies.add('], function(Opa5, MockServer');

    if (this._bindMatcher) {
      oDependencies.add(', BindingPath');
    }

    if (this._i18nMatcher) {
      oDependencies.add(', I18NText');
    }

    if (this._attMatcher) {
      oDependencies.add(', PropertyStrictEquals');
    }

    if (this._aggEmptyMatcher) {
      oDependencies.add(', AggregationEmpty');
    }

    if (this._aggFilledMatcher) {
      oDependencies.add(', AggregationFilled');
    }

    if (this._aggCountMatcher) {
      oDependencies.add(', AggregationLengthEquals');
    }

    if (this._enterTextAction) {
      oDependencies.add(', EnterText');
    }

    if (this._pressAction) {
      oDependencies.add(', Press');
    }

    if (this._parentMatcher) {
      oDependencies.add(', ParentMatcher');
    }

    oDependencies.add('){').addNewLine();
    return oDependencies;
  }

  private _addWrapParametersFunction(): StringBuilder {
    var oFunctCode = new StringBuilder();
    oFunctCode
      .addTab()
      .add('function _wrapParameters(oParameters) {')
      .addNewLine();
    oFunctCode.addTab(2).add('return {').addNewLine();
    oFunctCode.addTab(3).add('get: function(name) {').addNewLine();
    oFunctCode
      .addTab(4)
      .add('return (oParameters[name] || "").toString();')
      .addNewLine();
    oFunctCode.addTab(3).add('}').addNewLine();
    oFunctCode.addTab(2).add('};').addNewLine();
    oFunctCode.addTab().add('}').addNewLine(2);
    return oFunctCode;
  }
  //#endregion

  //#region actions
  private _generateActionFunctions(): StringBuilder {
    var oActions = new StringBuilder();
    if (this._actions['press'].render) {
      oActions.add(',').addNewLine(2);
      oActions.add(this.__generatePressFunction());
    }

    if (this._actions['enterText'].render) {
      oActions.add(',').addNewLine(2);
      oActions.add(this.__generateEnterTextFunction());
    }
    return oActions;
  }

  private __generateEnterTextFunction(): string {
    var oEnterText = new StringBuilder();
    oEnterText
      .addTab(2)
      .add('enterText: function(oActionProperties, oOptions) {')
      .addNewLine();
    oEnterText.addTab(3).add('var actionObject = {};').addNewLine();
    oEnterText
      .addTab(3)
      .add(
        'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}'
      )
      .addNewLine();
    oEnterText
      .addTab(3)
      .add(
        'if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}'
      )
      .addNewLine();
    oEnterText.addTab(3).add('actionObject.visible = true;').addNewLine();
    oEnterText
      .addTab(3)
      .add(
        'actionObject.actions = [new EnterText({text: oActionProperties.actionText})];'
      )
      .addNewLine();
    oEnterText.addTab(3).add('if (oOptions.success) {').addNewLine();
    oEnterText
      .addTab(4)
      .add('actionObject.success = oOptions.success;')
      .addNewLine();
    oEnterText.addTab(3).add('}').addNewLine();
    oEnterText.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oEnterText
      .addTab(4)
      .add('actionObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oEnterText.addTab(3).add('}').addNewLine(2);
    oEnterText.addTab(3).add('actionObject.matchers = [];').addNewLine(2);
    if (this._actions['enterText'].addAttributeMatcher) {
      oEnterText
        .addTab(3)
        .add(
          'if(oActionProperties.attributes && oActionProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oEnterText
        .addTab(4)
        .add(
          'this._addAttributeMatcher(actionObject.matchers, oActionProperties.attributes);'
        )
        .addNewLine();
      oEnterText.addTab(3).add('}').addNewLine();
    }
    if (this._actions['enterText'].addBindingMatcher) {
      oEnterText
        .addTab(3)
        .add(
          'if (oActionProperties.binding && oActionProperties.binding.length > 0) {'
        )
        .addNewLine();
      oEnterText
        .addTab(4)
        .add(
          'this._addBindingMatcher(actionObject.matchers, oActionProperties.binding);'
        )
        .addNewLine();
      oEnterText.addTab(3).add('}').addNewLine();
    }
    if (this._actions['enterText'].addI18NMatcher) {
      oEnterText
        .addTab(3)
        .add(
          'if (oActionProperties.i18n && oActionProperties.i18n.length > 0) {'
        )
        .addNewLine();
      oEnterText
        .addTab(4)
        .add(
          'this._addI18NMatcher(actionObject.matchers, oActionProperties.i18n);'
        )
        .addNewLine();
      oEnterText.addTab(3).add('}').addNewLine(2);
    }
    if (this._actions['enterText'].addParentMatcher) {
      oEnterText
        .addTab(3)
        .add(
          'if (oActionProperties.parent && oActionProperties.parent.length > 0) {'
        )
        .addNewLine();
      oEnterText
        .addTab(4)
        .add(
          'this._addI18NMatcher(actionObject.matchers, oActionProperties.parent);'
        )
        .addNewLine();
      oEnterText.addTab(3).add('}').addNewLine(2);
    }
    oEnterText.addTab(3).add('return this.waitFor(actionObject);').addNewLine();
    oEnterText.addTab(2).add('}');
    return oEnterText.toString();
  }

  private __generatePressFunction(): string {
    var oPress = new StringBuilder();
    oPress
      .addTab(2)
      .add('press: function(oActionProperties, oOptions) {')
      .addNewLine();
    oPress.addTab(3).add('var actionObject = {};').addNewLine();
    oPress
      .addTab(3)
      .add(
        'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}'
      )
      .addNewLine();
    oPress
      .addTab(3)
      .add(
        'if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}'
      )
      .addNewLine();
    oPress.addTab(3).add('actionObject.visible = true;').addNewLine();
    oPress.addTab(3).add('actionObject.actions = [new Press()];').addNewLine();
    oPress.addTab(3).add('if (oOptions.success) {').addNewLine();
    oPress
      .addTab(4)
      .add('actionObject.success = oOptions.success;')
      .addNewLine();
    oPress.addTab(3).add('}').addNewLine();
    oPress.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oPress
      .addTab(4)
      .add('actionObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oPress.addTab(3).add('}').addNewLine(2);
    oPress.addTab(3).add('actionObject.matchers = [];').addNewLine(2);
    if (this._actions['press'].addAttributeMatcher) {
      oPress
        .addTab(3)
        .add(
          'if(oActionProperties.attributes && oActionProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oPress
        .addTab(4)
        .add(
          'this._addAttributeMatcher(actionObject.matchers, oActionProperties.attributes);'
        )
        .addNewLine();
      oPress.addTab(3).add('}').addNewLine();
    }
    if (this._actions['press'].addBindingMatcher) {
      oPress
        .addTab(3)
        .add(
          'if (oActionProperties.binding && oActionProperties.binding.length > 0) {'
        )
        .addNewLine();
      oPress
        .addTab(4)
        .add(
          'this._addBindingMatcher(actionObject.matchers, oActionProperties.binding);'
        )
        .addNewLine();
      oPress.addTab(3).add('}').addNewLine();
    }
    if (this._actions['press'].addI18NMatcher) {
      oPress
        .addTab(3)
        .add(
          'if (oActionProperties.i18n && oActionProperties.i18n.length > 0) {'
        )
        .addNewLine();
      oPress
        .addTab(4)
        .add(
          'this._addI18NMatcher(actionObject.matchers, oActionProperties.i18n);'
        )
        .addNewLine();
      oPress.addTab(3).add('}').addNewLine(2);
    }
    if (this._actions['press'].addParentMatcher) {
      oPress
        .addTab(3)
        .add(
          'if (oActionProperties.parent && oActionProperties.parent.length > 0) {'
        )
        .addNewLine();
      oPress
        .addTab(4)
        .add(
          'this._addI18NMatcher(actionObject.matchers, oActionProperties.parent);'
        )
        .addNewLine();
      oPress.addTab(3).add('}').addNewLine(2);
    }
    oPress.addTab(3).add('return this.waitFor(actionObject);').addNewLine();
    oPress.addTab(2).add('}');
    return oPress.toString();
  }
  //#endregion actions

  //#region assertions
  private _generateAssertionFunctions(): StringBuilder {
    var oAssertFunctions = new StringBuilder();
    if (this._assertions['exists'].render) {
      oAssertFunctions.add(',').addNewLine();
      oAssertFunctions.add(this._renderExistsFunction());
    }
    if (this._assertions['attributes'].render) {
      oAssertFunctions.add(',').addNewLine();
      oAssertFunctions.add(this._renderAttributesFunction());
    }
    if (this._assertions['aggregationEmpty'].render) {
      oAssertFunctions.add(',').addNewLine();
      oAssertFunctions.add(this._renderEmptyAggFunction());
    }
    if (this._assertions['aggregationFilled'].render) {
      oAssertFunctions.add(',').addNewLine();
      oAssertFunctions.add(this._renderFilledAggFunction());
    }
    if (this._assertions['aggregationCount'].render) {
      oAssertFunctions.add(',').addNewLine();
      oAssertFunctions.add(this._renderCountAggFunction());
    }
    return oAssertFunctions;
  }

  private _renderExistsFunction(): string {
    var oExists = new StringBuilder();
    oExists
      .addTab(2)
      .add('thereShouldBe: function(oMatchProperties, oOptions) {')
      .addNewLine();
    oExists.addTab(3).add('var checkObject = {};').addNewLine();
    oExists
      .addTab(3)
      .add(
        'if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}'
      )
      .addNewLine();
    oExists
      .addTab(3)
      .add(
        'if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}'
      )
      .addNewLine(2);
    oExists.addTab(3).add('checkObject.visible = true;').addNewLine();
    oExists.addTab(3).add('if (oOptions.success) {').addNewLine();
    oExists
      .addTab(4)
      .add('checkObject.success = oOptions.success;')
      .addNewLine();
    oExists.addTab(3).add('}').addNewLine();
    oExists.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oExists
      .addTab(4)
      .add('checkObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oExists.addTab(3).add('}').addNewLine(2);
    oExists.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
    if (this._assertions['exists'].addAttributeMatcher) {
      oExists
        .addTab(3)
        .add(
          'if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oExists
        .addTab(4)
        .add(
          'this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);'
        )
        .addNewLine();
      oExists.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['exists'].addBindingMatcher) {
      oExists
        .addTab(3)
        .add(
          'if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {'
        )
        .addNewLine();
      oExists
        .addTab(4)
        .add(
          'this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);'
        )
        .addNewLine();
      oExists.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['exists'].addI18NMatcher) {
      oExists
        .addTab(3)
        .add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {')
        .addNewLine();
      oExists
        .addTab(4)
        .add(
          'this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);'
        )
        .addNewLine();
      oExists.addTab(3).add('}').addNewLine(2);
    }
    if (this._assertions['exists'].addParentMatcher) {
      oExists
        .addTab(3)
        .add(
          'if (oMatchProperties.parent && oMatchProperties.parent.length > 0) {'
        )
        .addNewLine();
      oExists
        .addTab(4)
        .add(
          'this._addParentMatcher(checkObject.matchers, oMatchProperties.parent);'
        )
        .addNewLine();
      oExists.addTab(3).add('}').addNewLine(2);
    }
    oExists.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
    oExists.addTab(2).add('}');

    return oExists.toString();
  }

  private _renderAttributesFunction(): string {
    var oAttributes = new StringBuilder();
    oAttributes
      .addTab(2)
      .add('hasAttributes: function(oMatchProperties, oOptions) {')
      .addNewLine();
    oAttributes.addTab(3).add('var checkObject = {};').addNewLine();
    oAttributes
      .addTab(3)
      .add(
        'if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}'
      )
      .addNewLine();
    oAttributes
      .addTab(3)
      .add(
        'if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}'
      )
      .addNewLine(2);
    oAttributes.addTab(3).add('checkObject.visible = true;').addNewLine();
    oAttributes.addTab(3).add('if (oOptions.success) {').addNewLine();
    oAttributes
      .addTab(4)
      .add('checkObject.success = oOptions.success;')
      .addNewLine();
    oAttributes.addTab(3).add('}').addNewLine();
    oAttributes.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oAttributes
      .addTab(4)
      .add('checkObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oAttributes.addTab(3).add('}').addNewLine(2);
    oAttributes.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
    if (this._assertions['attributes'].addAttributeMatcher) {
      oAttributes
        .addTab(3)
        .add(
          'if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oAttributes
        .addTab(4)
        .add(
          'this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);'
        )
        .addNewLine();
      oAttributes.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['attributes'].addBindingMatcher) {
      oAttributes
        .addTab(3)
        .add(
          'if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {'
        )
        .addNewLine();
      oAttributes
        .addTab(4)
        .add(
          'this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);'
        )
        .addNewLine();
      oAttributes.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['attributes'].addI18NMatcher) {
      oAttributes
        .addTab(3)
        .add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {')
        .addNewLine();
      oAttributes
        .addTab(4)
        .add(
          'this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);'
        )
        .addNewLine();
      oAttributes.addTab(3).add('}').addNewLine(2);
    }
    if (this._assertions['attributes'].addParentMatcher) {
      oAttributes
        .addTab(3)
        .add(
          'if (oMatchProperties.parent && oMatchProperties.parent.length > 0) {'
        )
        .addNewLine();
      oAttributes
        .addTab(4)
        .add(
          'this._addParentMatcher(checkObject.matchers, oMatchProperties.parent);'
        )
        .addNewLine();
      oAttributes.addTab(3).add('}').addNewLine(2);
    }
    oAttributes.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
    oAttributes.addTab(2).add('}');

    return oAttributes.toString();
  }

  private _renderEmptyAggFunction(): string {
    var oAggEmpty = new StringBuilder();
    oAggEmpty
      .addTab(2)
      .add('aggregationEmpty: function(oMatchProperties, oOptions) {')
      .addNewLine();
    oAggEmpty.addTab(3).add('var checkObject = {};').addNewLine();
    oAggEmpty
      .addTab(3)
      .add(
        'if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}'
      )
      .addNewLine();
    oAggEmpty
      .addTab(3)
      .add(
        'if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}'
      )
      .addNewLine(2);
    oAggEmpty.addTab(3).add('checkObject.visible = true;').addNewLine();
    oAggEmpty.addTab(3).add('if (oOptions.success) {').addNewLine();
    oAggEmpty
      .addTab(4)
      .add('checkObject.success = oOptions.success;')
      .addNewLine();
    oAggEmpty.addTab(3).add('}').addNewLine();
    oAggEmpty.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oAggEmpty
      .addTab(4)
      .add('checkObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oAggEmpty.addTab(3).add('}').addNewLine(2);
    oAggEmpty.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
    if (this._assertions['aggregationEmpty'].addAttributeMatcher) {
      oAggEmpty
        .addTab(3)
        .add(
          'if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oAggEmpty
        .addTab(4)
        .add(
          'this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);'
        )
        .addNewLine();
      oAggEmpty.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['aggregationEmpty'].addBindingMatcher) {
      oAggEmpty
        .addTab(3)
        .add(
          'if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {'
        )
        .addNewLine();
      oAggEmpty
        .addTab(4)
        .add(
          'this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);'
        )
        .addNewLine();
      oAggEmpty.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['aggregationEmpty'].addI18NMatcher) {
      oAggEmpty
        .addTab(3)
        .add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {')
        .addNewLine();
      oAggEmpty
        .addTab(4)
        .add(
          'this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);'
        )
        .addNewLine();
      oAggEmpty.addTab(3).add('}').addNewLine(2);
    }
    if (this._assertions['aggregationEmpty'].addParentMatcher) {
      oAggEmpty
        .addTab(3)
        .add(
          'if (oMatchProperties.parent && oMatchProperties.parent.length > 0) {'
        )
        .addNewLine();
      oAggEmpty
        .addTab(4)
        .add(
          'this._addParentMatcher(checkObject.matchers, oMatchProperties.parent);'
        )
        .addNewLine();
      oAggEmpty.addTab(3).add('}').addNewLine(2);
    }
    oAggEmpty.addTab(3).add('checkObject.matchers.push(').addNewLine();
    oAggEmpty.addTab(4).add('new AggregationEmpty({').addNewLine();
    oAggEmpty.addTab(5).add('name: oMatchProperties.aggName').addNewLine();
    oAggEmpty.addTab(4).add('}));').addNewLine();
    oAggEmpty.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
    oAggEmpty.addTab(2).add('}');

    return oAggEmpty.toString();
  }

  private _renderFilledAggFunction(): string {
    var oAggFilled = new StringBuilder();
    oAggFilled
      .addTab(2)
      .add('aggregationFilled: function(oMatchProperties, oOptions) {')
      .addNewLine();
    oAggFilled.addTab(3).add('var checkObject = {};').addNewLine();
    oAggFilled
      .addTab(3)
      .add(
        'if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}'
      )
      .addNewLine();
    oAggFilled
      .addTab(3)
      .add(
        'if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}'
      )
      .addNewLine(2);
    oAggFilled.addTab(3).add('checkObject.visible = true;').addNewLine();
    oAggFilled.addTab(3).add('if (oOptions.success) {').addNewLine();
    oAggFilled
      .addTab(4)
      .add('checkObject.success = oOptions.success;')
      .addNewLine();
    oAggFilled.addTab(3).add('}').addNewLine();
    oAggFilled.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oAggFilled
      .addTab(4)
      .add('checkObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oAggFilled.addTab(3).add('}').addNewLine(2);
    oAggFilled.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
    if (this._assertions['aggregationFilled'].addAttributeMatcher) {
      oAggFilled
        .addTab(3)
        .add(
          'if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oAggFilled
        .addTab(4)
        .add(
          'this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);'
        )
        .addNewLine();
      oAggFilled.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['aggregationFilled'].addBindingMatcher) {
      oAggFilled
        .addTab(3)
        .add(
          'if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {'
        )
        .addNewLine();
      oAggFilled
        .addTab(4)
        .add(
          'this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);'
        )
        .addNewLine();
      oAggFilled.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['aggregationFilled'].addI18NMatcher) {
      oAggFilled
        .addTab(3)
        .add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {')
        .addNewLine();
      oAggFilled
        .addTab(4)
        .add(
          'this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);'
        )
        .addNewLine();
      oAggFilled.addTab(3).add('}').addNewLine(2);
    }
    if (this._assertions['aggregationFilled'].addParentMatcher) {
      oAggFilled
        .addTab(3)
        .add(
          'if (oMatchProperties.parent && oMatchProperties.parent.length > 0) {'
        )
        .addNewLine();
      oAggFilled
        .addTab(4)
        .add(
          'this._addParentMatcher(checkObject.matchers, oMatchProperties.parent);'
        )
        .addNewLine();
      oAggFilled.addTab(3).add('}').addNewLine(2);
    }
    oAggFilled.addTab(3).add('checkObject.matchers.push(').addNewLine();
    oAggFilled.addTab(4).add('new AggregationFilled({').addNewLine();
    oAggFilled.addTab(5).add('name: oMatchProperties.aggName').addNewLine();
    oAggFilled.addTab(4).add('}));').addNewLine();
    oAggFilled.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
    oAggFilled.addTab(2).add('}');

    return oAggFilled.toString();
  }

  private _renderCountAggFunction(): string {
    var oAggCount = new StringBuilder();
    oAggCount
      .addTab(2)
      .add('aggregationCount: function(oMatchProperties, oOptions) {')
      .addNewLine();
    oAggCount.addTab(3).add('var checkObject = {};').addNewLine();
    oAggCount
      .addTab(3)
      .add(
        'if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}'
      )
      .addNewLine();
    oAggCount
      .addTab(3)
      .add(
        'if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}'
      )
      .addNewLine(2);
    oAggCount.addTab(3).add('checkObject.visible = true;').addNewLine();
    oAggCount.addTab(3).add('if (oOptions.success) {').addNewLine();
    oAggCount
      .addTab(4)
      .add('checkObject.success = oOptions.success;')
      .addNewLine();
    oAggCount.addTab(3).add('}').addNewLine();
    oAggCount.addTab(3).add('if (oOptions.errorMessage) {').addNewLine();
    oAggCount
      .addTab(4)
      .add('checkObject.errorMessage = oOptions.errorMessage;')
      .addNewLine();
    oAggCount.addTab(3).add('}').addNewLine(2);
    oAggCount.addTab(3).add('checkObject.matchers = [];').addNewLine(2);
    if (this._assertions['aggregationCount'].addAttributeMatcher) {
      oAggCount
        .addTab(3)
        .add(
          'if(oMatchProperties.attributes && oMatchProperties.attributes.length > 0) {'
        )
        .addNewLine();
      oAggCount
        .addTab(4)
        .add(
          'this._addAttributeMatcher(checkObject.matchers, oMatchProperties.attributes);'
        )
        .addNewLine();
      oAggCount.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['aggregationCount'].addBindingMatcher) {
      oAggCount
        .addTab(3)
        .add(
          'if (oMatchProperties.binding && oMatchProperties.binding.length > 0) {'
        )
        .addNewLine();
      oAggCount
        .addTab(4)
        .add(
          'this._addBindingMatcher(checkObject.matchers, oMatchProperties.binding);'
        )
        .addNewLine();
      oAggCount.addTab(3).add('}').addNewLine();
    }
    if (this._assertions['aggregationCount'].addI18NMatcher) {
      oAggCount
        .addTab(3)
        .add('if (oMatchProperties.i18n && oMatchProperties.i18n.length > 0) {')
        .addNewLine();
      oAggCount
        .addTab(4)
        .add(
          'this._addI18NMatcher(checkObject.matchers, oMatchProperties.i18n);'
        )
        .addNewLine();
      oAggCount.addTab(3).add('}').addNewLine(2);
    }
    if (this._assertions['aggregationCount'].addParentMatcher) {
      oAggCount
        .addTab(3)
        .add(
          'if (oMatchProperties.parent && oMatchProperties.parent.length > 0) {'
        )
        .addNewLine();
      oAggCount
        .addTab(4)
        .add(
          'this._addParentMatcher(checkObject.matchers, oMatchProperties.parent);'
        )
        .addNewLine();
      oAggCount.addTab(3).add('}').addNewLine(2);
    }
    oAggCount.addTab(3).add('checkObject.matchers.push(').addNewLine();
    oAggCount.addTab(4).add('new AggregationLengthEquals({').addNewLine();
    oAggCount.addTab(5).add('name: oMatchProperties.aggName,').addNewLine();
    oAggCount.addTab(5).add('length: oMatchProperties.count').addNewLine();
    oAggCount.addTab(4).add('}));').addNewLine();
    oAggCount.addTab(3).add('return this.waitFor(checkObject);').addNewLine();
    oAggCount.addTab(2).add('}');

    return oAggCount.toString();
  }
  //#endregion
}
