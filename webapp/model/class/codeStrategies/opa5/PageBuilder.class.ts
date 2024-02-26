export type AdderOptions = { [key: string]: boolean };

export abstract class PageBuilder {
  _namespace: string;
  _viewName: string;
  _baseClass: string;
  _dependencies: { asyncDep: string; paramDep: string }[];
  _actions: {
    [key: string]: {
      render: boolean;
      addBindingMatcher: boolean;
      addI18NMatcher: boolean;
      addAttributeMatcher: boolean;
      addParentMatcher: boolean;
    };
  };
  _assertions: {
    [key: string]: {
      render: boolean;
      addBindingMatcher: boolean;
      addI18NMatcher: boolean;
      addAttributeMatcher: boolean;
      addParentMatcher: boolean;
    };
  };
  _customMatchers: { [key: string]: boolean };

  constructor() {
    this._namespace = '<namespace>';
    this._viewName = 'view1';
    this._baseClass = 'Common';
    this._dependencies = [
      {
        asyncDep: 'sap/ui/test/Opa5',
        paramDep: 'Opa5',
      },
    ];

    this._actions = {
      press: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
      enterText: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
      // additional feature later on could be Drag&Drop
    };

    this._assertions = {
      exists: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
      attributes: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
      aggregationEmpty: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
      aggregationFilled: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
      aggregationCount: {
        render: false,
        addBindingMatcher: false,
        addI18NMatcher: false,
        addAttributeMatcher: false,
        addParentMatcher: false,
      },
    };

    this._customMatchers = {
      parent: false,
    };
  }

  //#region getter/setter
  public set namespace(namespace: string) {
    this._namespace = namespace;
  }

  public get namespace(): string {
    return this._namespace;
  }

  public set viewName(viewName: string) {
    this._viewName = viewName;
  }

  public get viewName(): string {
    return this._viewName;
  }

  public set baseClass(baseClass: string) {
    this._baseClass = baseClass;
  }

  public get baseClass(): string {
    return this._baseClass;
  }
  //#endregion getter/setter

  /**
   *  Generic settings method for the adder
   *
   * @returns {com.ui5.testing.model.code-generation.opa5.PageBuilder} self reference for chaining
   */
  _adder(type: string, options: AdderOptions): this {
    if (Object.keys(this._actions).includes(type)) {
      this._actions[type].render = true;
      this._actions[type].addBindingMatcher = options['binding']
        ? true
        : this._actions[type].addBindingMatcher;
      this._actions[type].addI18NMatcher = options['i18n']
        ? true
        : this._actions[type].addI18NMatcher;
      this._actions[type].addAttributeMatcher = options['attribute']
        ? true
        : this._actions[type].addAttributeMatcher;
      this._actions[type].addParentMatcher = options['parent']
        ? true
        : this._actions[type].addParentMatcher;
    }
    if (Object.keys(this._assertions).includes(type)) {
      this._assertions[type].render = true;
      this._assertions[type].addBindingMatcher = options['binding']
        ? true
        : this._assertions[type].addBindingMatcher;
      this._assertions[type].addI18NMatcher = options['i18n']
        ? true
        : this._assertions[type].addI18NMatcher;
      this._assertions[type].addAttributeMatcher = options['attribute']
        ? true
        : this._assertions[type].addAttributeMatcher;
      this._assertions[type].addParentMatcher = options['parent']
        ? true
        : this._assertions[type].addParentMatcher;
    }
    return this;
  }

  public addPressAction(options: AdderOptions): this {
    return this._adder('press', options);
  }

  public addEnterTextAction(options: AdderOptions): this {
    return this._adder('enterText', options);
  }

  public addValidationStep(options: AdderOptions): this {
    return this._adder('exists', options);
  }

  public addAttributesCheck(options: AdderOptions): this {
    return this._adder('attributes', options);
  }

  public addAggregationEmptyCheck(options: AdderOptions): this {
    return this._adder('aggregationEmpty', options);
  }

  public addAggregationFilledCheck(options: AdderOptions): this {
    return this._adder('aggregationFilled', options);
  }

  public addAggregationCountCheck(options: AdderOptions): this {
    return this._adder('aggregationCount', options);
  }

  public abstract generate(): string;
}
