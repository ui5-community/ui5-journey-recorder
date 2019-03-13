sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/ValueState",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    "sap/m/MessageBox",
    "com/ui5/testing/model/GlobalSettings",
    "com/ui5/testing/model/Navigation",
    "com/ui5/testing/model/Communication",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/CodeHelper"
], function (Controller, Object, JSONModel, MessageToast, ValueState, MessagePopover, MessageItem, MessageBox, GlobalSettings, Navigation, Communication, RecordController, CodeHelper) {
    "use strict";

    var TestHandler = Controller.extend("com.ui5.testing.controller.ui5Testing", {
        _oDialog: null,
        _oPopoverAction: null,
        _bDialogActive: false,
        _oModel: new JSONModel({
            element: {
                property: {}, //properties
                item: {}, //current item itself,
                attributeFilter: [], //table entries of selectors
                assertFilter: [], //table entries of asserts,
                messages: []
            },
            codeSettings: {
                language: "UI5"
            },
            quickSelect: false,
            code: "",
            elements: [],
            elementLength: 0,
            elementDefault: {
                property: {
                    assKeyMatchingCount: 1,
                    elementState: "Success",
                    assKey: "EXS",
                    assertMessage: "",
                    selectActInsert: "",
                    actKey: "PRS",
                    type: "ACT",
                    selectItemBy: "UI5",
                    technicalName: "",
                    useTechnicalName: true,
                    previewCode: "",
                    actionSettings: {
                        testSpeed: 1,
                        replaceText: false,
                        pasteText: false,
                        blur: false,
                        enter: false
                    },
                    supportAssistant: {
                        ignoreGlobal: false,
                        supportRules: []
                    }
                },
                identifiedElements: [], //elements which are fitting to the current selector
                item: {},
                attributeFilter: [],
                assertFilter: [],
                subActionTypes: [],
                supportAssistantResult: []
            },
            dynamic: {
                attrType: []
            },
            statics: {
                supportRules: [],
            },
            selectMode: true, //are we within selection or within code check
            completeCode: "",
            completeCodeSaved: "",
            ratingOfAttributes: 3,
            isStretched: false,
            codes: [],
            idQualityState: ValueState.None,
            idQualityStateText: "",
            codeLines: [] //currently maintained code-lines
        }),
        _bActive: false,
        _bStarted: false,
        _sTestId: "",

        onInit: function () {
            this._getCriteriaTypes();
            this._initMessagePopover();
            this.getView().setModel(this._oModel, "viewModel");
            this.getView().setModel(Navigation.getModel(), "navModel");

            this.getRouter().getRoute("elementCreate").attachPatternMatched(this._onObjectMatched, this);
            this.getRouter().getRoute("elementCreateQuick").attachPatternMatched(this._onObjectMatchedQuick, this);
            this.getRouter().getRoute("elementDisplay").attachPatternMatched(this._onObjectMatchedInReplay, this);
            //sap.ui.getCore().getEventBus().subscribe("RecordController", "windowFocusLost", this._recordStopped, this);
        }
    });

    TestHandler.prototype._onObjectMatched = function (oEvent) {
        this._sTestId = oEvent.getParameter("arguments").TestId;
        this._bReplayMode = false;
        this._oModel.setProperty("/quickMode", false);
        this._oModel.setProperty("/replayMode", false);
        var oItem = Navigation.getSelectedItem();
        if (!oItem || JSON.stringify(oItem) == "{}") {
            this.getRouter().navTo("start");
            return;
        }
        this.onClick(oItem);
    };

    TestHandler.prototype._onObjectMatchedQuick = function (oEvent) {
        this._sTestId = oEvent.getParameter("arguments").TestId;
        this._bReplayMode = false;
        this._oModel.setProperty("/quickMode", true);
        this._oModel.setProperty("/replayMode", false);
        var oItem = Navigation.getSelectedItem();
        if (!oItem || JSON.stringify(oItem) == "{}") {
            this.getRouter().navTo("start");
            return;
        }
        this.onClick(oItem);
    };

    TestHandler.prototype._onObjectMatchedInReplay = function (oEvent) {
        this._sTestId = oEvent.getParameter("arguments").TestId;
        this._sElementId = oEvent.getParameter("arguments").ElementId;
        this._bReplayMode = true;
        var aItems = this.getModel("navModel").getProperty("/elements");
        var oItem = aItems[this._sElementId];
        this._oModel.setProperty("/element", oItem);
        this._oModel.setProperty("/quickMode", false);
        this._oModel.setProperty("/replayMode", true);
        this._updateSubActionTypes(false);
        this._adjustDomChildWith(this._oModel.getProperty("/element/item"));
        this._updatePreview();

        this._oModel.setProperty("/element/item", oItem);
        this._oModel.setProperty("/element/attributeFilter", []);
        this._oModel.setProperty("/element/assertFilter", []);
    };

    /*
    TestHandler.prototype._recordStopped = function () {
    };*/

    TestHandler.prototype.onShowActionSettings = function (oEvent) {
        this._createActionPopover();
        this._oPopoverAction.openBy(oEvent.getSource());
    };

    TestHandler.prototype._initMessagePopover = function () {
        var oMessageTemplate = new MessageItem({
            type: '{viewModel>type}',
            title: '{viewModel>title}',
            description: '{viewModel>description}',
            subtitle: '{viewModel>subtitle}'
        });

        this._oMessagePopover = new MessagePopover({
            items: {
                path: 'viewModel>/element/messages',
                template: oMessageTemplate
            }
        });

        this._oMessagePopoverAssert = new MessagePopover({
            items: {
                path: 'viewModel>assertMessages',
                template: oMessageTemplate
            }
        });

        this._oMessagePopover.setModel(this._oModel, "viewModel");
        this._oMessagePopoverAssert.setModel(this._oModel, "viewModel");

        var oTemplateCtx = new sap.m.ColumnListItem({
            type: "Active",
            cells: [
                new sap.m.ObjectIdentifier({ title: '{viewModel>typeTxt}' }),
                new sap.m.ObjectIdentifier({ title: '{viewModel>attribute}' }),
                new sap.m.Text({ text: '{viewModel>valueToString}' }),
                new sap.m.ObjectNumber({
                    visible: '{viewModel>/element/itemCloned}',
                    number: '{viewModel>importance}',
                    state: '{viewModel>numberState}',
                    unit: '%'
                }),
            ]
        });
        this._oTableContext = new sap.m.Table({
            mode: "MultiSelect",
            itemPress: function (oEvent) {
                if (oEvent.getSource().setSelected) {
                    oEvent.getSource().setSelected(oEvent.getSource().getSelected() === false);
                } else {
                    oEvent.getParameter("listItem").setSelected(oEvent.getParameter("listItem").getSelected() === false);
                }
            },
            columns: [
                new sap.m.Column({ header: new sap.m.Text({ text: "Type" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Name" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Value" }) }),
                new sap.m.Column({ visible: '{viewModel>/element/itemCloned}', header: new sap.m.Text({ text: "Expected Quality" }) }),
            ],
            items: {
                path: 'viewModel>/element/possibleContext',
                template: oTemplateCtx
            }
        });

        this._oSelectDialog = new sap.m.Dialog({
            contentHeight: "75%",
            contentWidth: "40%",
            id: "tstDialog",
            title: "Please specifiy a unique combination",
            content: new sap.m.VBox({
                items: [
                    new sap.m.SearchField({
                        liveChange: function (oEvent) {
                            var sSearch = oEvent.getParameter("newValue");
                            if (!sSearch || !sSearch.length) {
                                this._oTableContext.getBinding("items").filter([]);
                            } else {
                                this._oTableContext.getBinding("items").filter([
                                    new sap.ui.model.Filter({
                                        and: false,
                                        filters: [
                                            new sap.ui.model.Filter({
                                                path: "typeTxt",
                                                operator: sap.ui.model.FilterOperator.Contains,
                                                value1: sSearch
                                            }),
                                            new sap.ui.model.Filter({
                                                path: "attribute",
                                                operator: sap.ui.model.FilterOperator.Contains,
                                                value1: sSearch
                                            }),
                                            new sap.ui.model.Filter({
                                                path: "valueToString",
                                                operator: sap.ui.model.FilterOperator.Contains,
                                                value1: sSearch
                                            })]
                                    })
                                ]);
                            }
                        }.bind(this)
                    }),
                    this._oTableContext
                ]
            }),
            beginButton: new sap.m.Button({
                text: 'Close',
                press: function () {
                    this._oSelectDialog.close();
                }.bind(this)
            }),
            endButton: new sap.m.Button({
                text: 'Save',
                press: function () {
                    var aItems = this._oTableContext.getSelectedItems();
                    if (aItems && aItems.length) {
                        for (var j = 0; j < aItems.length; j++) {
                            var oBndgCtxObj = aItems[j].getBindingContext("viewModel").getObject();
                            this._add("/element/attributeFilter", { attributeType: "OWN", criteriaType: oBndgCtxObj.type, subCriteriaType: oBndgCtxObj.bdgPath });
                        }
                        this._updatePreview();
                    }
                    this._oSelectDialog.close();
                }.bind(this)
            })
        });

        this._oSelectDialog.addStyleClass("sapUiSizeCompact");
    };

    TestHandler.prototype._getAssertDefinition = function (oElement) {
        var sBasisCode = "";
        var sCode = "";
        var aAsserts = oElement.assertFilter;
        var oAssertScope = {};
        var sAssertType = oElement.property.assKey;
        var sAssertMsg = oElement.property.assertMessage;
        var aCode = [];
        var sAssertCount = oElement.property.assKeyMatchingCount;
        var aReturnCodeSimple = [];

        if (sAssertType === 'ATTR') {
            sBasisCode += ".getUI5(" + "({ element }) => element.";
            for (var x = 0; x < aAsserts.length; x++) {
                oAssertScope = {}; //reset per line..
                var oAssert = aAsserts[x];

                var oAssertLocalScope = this._attributeTypes[oAssert.attributeType].getAssertScope(oAssertScope);
                var oAssertSpec = this._getValueSpec(oAssert, oElement.item);
                if (oAssertSpec === null) {
                    continue;
                }

                var sAssertFunc = "";
                if (oAssert.operatorType == 'EQ') {
                    sAssertFunc = 'eql'
                } else if (oAssert.operatorType === 'NE') {
                    sAssertFunc = 'notEql'
                } else if (oAssert.operatorType === 'CP') {
                    sAssertFunc = 'contains'
                } else if (oAssert.operatorType === 'NP') {
                    sAssertFunc = 'notContains'
                }



                var sAddCode = sBasisCode;
                var sAssertCode = oAssertSpec.assert();
                sAddCode += sAssertCode;

                var oUI5Spec = {};
                oAssertSpec.getUi5Spec(oUI5Spec, oElement.item, oAssert.criteriaValue)

                aReturnCodeSimple.push({
                    assertType: oAssert.operatorType,
                    assertLocation: sAssertCode,
                    assertOperator: oAssert.operatorType,
                    assertValue: oAssert.criteriaValue,
                    assertField: oAssertSpec.assertField(),
                    assertUI5Spec: oUI5Spec,
                    assertMsg: sAssertMsg
                });

                sAddCode += "))" + "." + sAssertFunc + "(" + "'" + oAssert.criteriaValue + "'";
                if (sAssertMsg !== "") {
                    sAddCode += "," + '"' + sAssertMsg + '"';
                }
                sAddCode += ")";
                aCode.push(sAddCode);
            }
        } else if (sAssertType === "EXS") {
            sCode = sBasisCode + ".exists).ok(";
            if (sAssertMsg !== "") {
                sCode += '"' + sAssertMsg + '"';
            }
            sCode += ")";
            aCode.push(sCode);
        } else if (sAssertType === "MTC") {
            sCode = sBasisCode + ".count).eql(" + parseInt(sAssertCount, 10) + "";
            if (sAssertMsg !== "") {
                sCode += "," + '"' + sAssertMsg + '"';
            }
            sCode += ")";
            aCode.push(sCode);
        }

        return {
            code: aCode,
            assertType: sAssertType,
            assertMsg: sAssertMsg,
            assertCode: aReturnCodeSimple,
            assertMatchingCount: sAssertCount,
            assertScope: oAssertLocalScope
        }
    };

    TestHandler.prototype._adjustBeforeSaving = function (oElement) {
        //what we are actually saving, is an extremly reduced form, of everything we need for code generation
        var oReturn = {
            property: oElement.property,
            item: oElement.item,
            attributeFilter: oElement.attributeFilter,
            assertFilter: oElement.assertFilter,
            subActionTypes: oElement.subActionTypes,
            selector: this._getSelectorDefinition(oElement),
            assertion: this._getAssertDefinition(oElement),
            href: "",
            hash: "",
            stepExecuted: true
        };

        //adjust the technical name if duplicates..
        var aProp = this.getModel("navModel").getProperty("/elements");
        var bFound = true;
        var iIndex = 1;
        var sNameOriginal = oReturn.property.technicalName;
        while (bFound === true) {
            bFound = false;
            for (var i = 0; i < aProp.length; i++) {
                if (aProp[i].item.identifier.ui5AbsoluteId === oReturn.item.identifier.ui5AbsoluteId) {
                    //reuse the same like before - whatever was provided..
                    oReturn.property.technicalName = aProp[i].property.technicalName;
                    break;
                }

                if (aProp[i].property.technicalName === oReturn.property.technicalName &&
                    aProp[i].item.identifier.ui5AbsoluteId !== oReturn.item.identifier.ui5AbsoluteId) {
                    oReturn.property.technicalName = sNameOriginal + iIndex;
                    iIndex = iIndex + 1;
                    bFound = true;
                    break;
                }
            }
        }

        return new Promise(function (resolve, reject) {
            Communication.fireEvent("getwindowinfo").then(function (oData) {
                if (!oData) {
                    return;
                }
                oReturn.href = oData.url;
                oReturn.hash = oData.hash;
                resolve(JSON.parse(JSON.stringify(oReturn)));
            });
        });
    };

    TestHandler.prototype._onCancelStep = function () {
        if (this._bReplayMode === true) {
            this.getRouter().navTo("testReplay", {
                TestId: this._sTestId
            }, true);
        } else {
            this.getRouter().navTo("testDetails", {
                TestId: this._sTestId
            }, true);
        }
        RecordController.startRecording();
    };

    TestHandler.prototype._onStopFromQuick = function () {
        RecordController.stopRecording();
        window.close();
    };

    TestHandler.prototype._onNewStepFromQuick = function () {
        this.getRouter().navTo("testDetailsCreateQuick", {
        }, true);
    };

    TestHandler.prototype._onSave = function () {
        this._save(function () {
            //navigate backwards to the screen, and immediatly start recording..
            if (this._bReplayMode === true) {
                this.getRouter().navTo("testReplay", {
                    TestId: this._sTestId
                }, true);
            } else {
                this.getRouter().navTo("testDetails", {
                    TestId: this._sTestId
                }, true);
                RecordController.startRecording();
            }
        }.bind(this));
    };

    TestHandler.prototype._save = function (fnCallback) {
        this._checkAndDisplay(function () {
            var oCurrentElement = this._oModel.getProperty("/element");
            this._adjustBeforeSaving(oCurrentElement).then(function (oElementFinal) {
                var aElements = this.getModel("navModel").getProperty("/elements");
                if (this._bReplayMode === true) {
                    aElements[this._sElementId] = oElementFinal;
                } else {
                    aElements.push(oElementFinal);
                }
                this.getModel("navModel").setProperty("/elements", aElements);
                this.getModel("navModel").setProperty("/elementLength", aElements.length);

                this._executeAction(this._oModel.getProperty("/element")).then(function () {
                    fnCallback();
                });
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._executeAction = function (oElement) {
        return new Promise(function (resolve, reject) {
            if (oElement.property.type !== "ACT") {
                resolve();
                return false;
            }
            this._getFoundElements().then(function (aElements) {
                if (aElements.length === 0) {
                    resolve();
                    return;
                }
                oElement.item.identifier = aElements[0].identifier;
                Communication.fireEvent("execute", {
                    element: oElement
                }).then(resolve);
            });
        }.bind(this));
    };

    TestHandler.prototype.onUpdateAction = function (oEvent) {
        this._updateSubActionTypes(false);
        this._adjustDomChildWith(this._oModel.getProperty("/element/item"));
        this._updatePreview();
    };

    TestHandler.prototype._updateSubActionTypes = function () {
        var oItem = this._oModel.getProperty("/element/item");
        var sAction = this._oModel.getProperty("/element/property/actKey");
        var sDomChildWith = this._oModel.getProperty("/element/property/domChildWith");
        var oItemMeta = this._getMergedClassArray(oItem);
        var aRows = [];
        if (oItemMeta.actions[sAction]) {
            aRows = oItemMeta.actions[sAction];
        }

        //add those children which we are missing at the moment (so basically, all chidlren with the same control)
        var aSubObjects = oItem.children;
        for (var i = 0; i < aSubObjects.length; i++) {
            var sIdChild = aSubObjects[i].domChildWith;
            //check if sIdChild is part of our current "domChildWith"
            if (aRows.filter(function (e) { return e.domChildWith === sIdChild; }).length === 0) {
                aRows.push({
                    text: aSubObjects[i].isInput === true ? "In Input-Field" : sIdChild,
                    domChildWith: sIdChild,
                    order: 9999
                });
            }
        }
        aRows = aRows.sort(function (a, b) { if (a.order > b.order) { return 1; } else { return -1; } });

        //check if the current value is fine..
        if (aRows.filter(function (e) { return e.domChildWith === sDomChildWith; }).length === 0) {
            sDomChildWith = aRows.length >= 0 ? aRows[0].domChildWith : "";
            this._oModel.setProperty("/element/property/domChildWith", sDomChildWith);
        }
        //we now have a valid value - check if there is any preferred value for the currently selected
        this._oModel.setProperty("/element/subActionTypes", aRows);
    };

    //returns { ok: false/true + message }
    TestHandler.prototype._check = function () {
        return new Promise(function (resolve, reject) {
            this._getAttributeRating().then(function (oReturn) {
                resolve({
                    rating: oReturn.rating,
                    message: oReturn.messages.length ? oReturn.messages[0].description : "",
                    messages: oReturn.messages
                });
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._checkElementNumber = function () {
        this._check().then(function (oCheck) {
            if (oCheck.rating === 5) {
                this._oModel.setProperty("/element/property/elementState", "Success");
            } else if (oCheck.rating >= 2) {
                this._oModel.setProperty("/element/property/elementState", "Warning");
            } else {
                this._oModel.setProperty("/element/property/elementState", "Error");
            }
        }.bind(this));
    };

    TestHandler.prototype.onExplain = function (oEvent) {
        this._oMessagePopover.toggle(oEvent.getSource());
    }

    //check if the data entered seems to be valid.. following checks are performed
    //(1) ID is used and generated
    //(2) ID is used and cloned
    //(3) DOM-ID is used (should be avoided where possible)
    //(4) No or >1 Element is selected..
    TestHandler.prototype._checkAndDisplay = function (fnCallback) {
        this._check().then(function (oResult) {
            if (oResult.rating !== 5) {
                MessageBox.show(oResult.message, {
                    styleClass: "sapUiCompact",
                    icon: MessageBox.Icon.WARNING,
                    title: "There are open issues - Are you sure you want to save?",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            fnCallback();
                        }
                    }
                });
            } else {
                fnCallback();
            }
        }.bind(this))
    };

    TestHandler.prototype._updatePreview = function () {
        var oItem = this._oModel.getProperty("/element");
        oItem = this._adjustBeforeSaving(oItem).then(function (oElementFinal) {
            this._getFoundElements().then(function (aElements) {
                this._oModel.setProperty("/element/identifiedElements", aElements);
                if (aElements.length !== 1) {
                    //we are only expanding, in case we are in ACTION mode - reason: the user has to do sth. in case we are in action mode, as only one can be selected..
                    if (this._oModel.getProperty("/element/property/type") === 'ACT') {
                        this.byId("atrElementsPnl").setExpanded(true);
                    }
                }
                this._checkElementNumber();
                this._resumePerformanceBindings();

                var sLanguage = this.getView().byId('tstLanguage').getSelectedKey();

                this.getModel("viewModel").setProperty("/code", CodeHelper.getItemCode(sLanguage, oElementFinal, this.getOwnerComponent()).join("\n"));
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._findItemAndExclude = function (oSelector) {
        return new Promise(function (resolve, reject) {
            Communication.fireEvent("find", oSelector).then(function (aItemsEnhanced) {
                for (var i = 0; i < aItemsEnhanced.length; i++) {
                    var oItem = aItemsEnhanced[i];
                    if (oItem.aggregationArray) {
                        oItem.aggregation = {};
                        for (var j = 0; j < oItem.aggregationArray.length; j++) {
                            oItem.aggregation[oItem.aggregationArray[j].name] = oItem.aggregationArray[j];
                        }
                    }
                }
                resolve(aItemsEnhanced);
            }.bind(this))
        }.bind(this));
    };

    TestHandler.prototype._getFoundElements = function () {
        var oDefinition = this._getSelectorDefinition(typeof oElement === "undefined" ? this._oModel.getProperty("/element") : oElement);

        return new Promise(function (resolve, reject) {
            this._findItemAndExclude(oDefinition.selectorAttributes).then(function (aItemsEnhanced) {
                //append information about assertions..
                if (this._oModel.getProperty("/element/property/type") === 'ASS' &&
                    this._oModel.getProperty("/element/property/assKey") === 'ATTR') {
                    var oAssertDef = this._oModel.getProperty("/element/assertFilter");
                    for (var i = 0; i < aItemsEnhanced.length; i++) {
                        var bFound = false;
                        var aAllErrors = [];
                        //check for every single assert, and store result..
                        for (var j = 0; j < oAssertDef.length; j++) {
                            var bFoundSingle = false;
                            var oAssertScope = {};
                            var oAssert = oAssertDef[j];
                            var sAssertLocalScope = this._attributeTypes[oAssert.attributeType].getAssertScope(oAssertScope);
                            var oAssertSpec = this._getValueSpec(oAssert, aItemsEnhanced[i]);
                            if (!oAssertSpec) {
                                continue; //non valid line..
                            }
                            var sAssert = sAssertLocalScope + oAssertSpec.assert();
                            var aSplit = sAssert.split(".");
                            var oCurItem = aItemsEnhanced[i];
                            var sCurrentError = "";
                            for (var x = 0; x < aSplit.length; x++) {
                                if (typeof oCurItem[aSplit[x]] === "undefined") {
                                    bFoundSingle = true;
                                    break;
                                }
                                oCurItem = oCurItem[aSplit[x]];
                            }
                            if (bFoundSingle === false) {
                                //depending on the operator, all ok or nothing ok :-)
                                if (oAssert.operatorType === "EQ" && oAssert.criteriaValue !== oCurItem) {
                                    bFoundSingle = true;
                                    sCurrentError = "Value " + oAssert.criteriaValue + " of " + sAssert + " does not match " + oCurItem;
                                } else if (oAssert.operatorType === "NE" && oAssert.criteriaValue === oCurItem) {
                                    bFoundSingle = true;
                                    sCurrentError = "Value " + oAssert.criteriaValue + " of " + sAssert + " does match " + oCurItem;
                                } else if (oAssert.operatorType === "CP" || oAssert.operatorType === "NP") {
                                    //convert both to string if required..
                                    var sStringContains = oAssert.criteriaValue;
                                    var sStringCheck = oCurItem;
                                    if (typeof sStringCheck !== "string") {
                                        sStringCheck = sStringCheck.toString();
                                    }
                                    if (typeof sStringContains !== "string") {
                                        sStringContains = sStringContains.toString();
                                    }
                                    if (sStringCheck.indexOf(sStringContains) === -1 && oAssert.operatorType === "CP") {
                                        bFoundSingle = true;
                                    } else if (sStringCheck.indexOf(sStringContains) !== -1 && oAssert.operatorType === "NP") {
                                        bFoundSingle = true;
                                    }
                                }
                            }
                            oAssert.assertionOK = bFoundSingle === false;
                            if (bFoundSingle === true) {
                                bFound = true;
                                aAllErrors.push({
                                    description: sCurrentError,
                                    title: "Assertion Error",
                                    subtitle: sCurrentError,
                                    type: "Error"
                                });
                            }
                        }
                        aItemsEnhanced[i].assertMessages = aAllErrors;
                        aItemsEnhanced[i].assertionOK = bFound === false;
                    }
                }
                resolve(aItemsEnhanced);
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype.onShowAssertionIssue = function (oEvent) {
        this._oMessagePopoverAssert.setBindingContext(oEvent.getSource().getBindingContext("viewModel"), "viewModel");
        this._oMessagePopoverAssert.toggle(oEvent.getSource());
    };

    TestHandler.prototype.onChangeCriteriaValue = function (oEvent) {
        //reformat to have the correct data type..
        var oAttributeCtx = oEvent.getSource().getBindingContext("viewModel");
        var oAttribute = oAttributeCtx.getObject();
        var oScope = this._oModel.getProperty("/element/item");
        var oSubScope = this._attributeTypes[oAttribute.attributeType].getScope(oScope);

        if (oAttribute.criteriaType === "ATTR") {
            //get the corresponding value from metadata..
            if (oSubScope.metadata && oSubScope.metadata.elementName) {
                var oElement = jQuery.sap.getObject(oSubScope.metadata.elementName);
                if (oElement) {
                    var oMetadata = oElement.getMetadata();
                    if (oMetadata) {
                        var oType = oMetadata.getProperty(oAttribute.subCriteriaType);
                        if (oType) {
                            oAttribute.criteriaValue = oType.getType().parseValue(oAttribute.criteriaValue);
                            this._oModel.setProperty(oAttributeCtx.getPath() + "/criteriaValue", oAttribute.criteriaValue);
                        }
                    }
                }
            }
        } else if (oAttribute.criteriaType === "AGG") {
            //we anyways only have length for the moment - change it to integer..
            this._oModel.setProperty(oAttributeCtx.getPath() + "/criteriaValue", parseInt(oAttribute.criteriaValue, 10));
        }
        this.onUpdatePreview();
    };

    TestHandler.prototype.onRunSupportAssistant = function () {
        this._runSupportAssistantForSelElement();
    };

    TestHandler.prototype._runSupportAssistantForSelElement = function () {
        this._runSupportAssistant(); //TODO
    };

    TestHandler.prototype._runSupportAssistant = function () {
        Communication.fireEvent("runSupportAsssistant",
            {
                component: this._oModel.getProperty("/element/item/metadata/componentName"),
                rules: this._oModel.getProperty("/element/property/supportAssistant")
            }).then(
                function (oStoreIssue) {
                    this._oModel.setProperty("/statics/supportRules", oStoreIssue.rules);
                    this._oModel.setProperty("/element/supportAssistantResult", oStoreIssue.results);
                    this._oModel.setProperty("/element/supportAssistantResultLength", oStoreIssue.results.length);
                    this._updatePreview();
                }.bind(this));
    };

    TestHandler.prototype._convertValueSpecToUI5 = function (oSpec, oSelectorUI5, oAttribute, oItem) {
        var oScopeLocal = this._attributeTypes[oAttribute.attributeType].getScope(oSelectorUI5);
        if (oAttribute.attributeType === "OWN") {
            oSelectorUI5.own = typeof oSelectorUI5.own !== "undefined" ? oSelectorUI5.own : {};
            oScopeLocal = oSelectorUI5.own;
        }
        oSpec.getUi5Spec(oScopeLocal, oItem);
    };

    TestHandler.prototype.onExpandControl = function (oEvent) {
        var oPanel = oEvent.getSource().getParent();
        oPanel.setExpanded(oPanel.getExpanded() === false);
    };

    TestHandler.prototype._getSelectorDefinition = function (oElement) {
        var oScope = {};
        var sSelector = "";
        var sSelectorAttributes = "";
        var sSelectorAttributesStringified = null;
        var sSelectorAttributesBtf = "";
        var oItem = oElement.item;
        var sActType = oElement.property.actKey; //PRS|TYP
        var sSelectType = oElement.property.selectItemBy; //DOM | UI5 | ATTR
        var sSelectorExtension = oElement.property.domChildWith;
        var oSelectorUI5 = {
        };

        if (sSelectType === "DOM") {
            sSelector = "Selector";
            sSelectorAttributes = '#' + oElement.item.identifier.domId + sSelectorExtension;
            sSelectorAttributesStringified = '"' + sSelectorAttributes + '"';
            oSelectorUI5.id = sSelectorAttributes;
        } else if (sSelectType === "UI5") {
            sSelector = "UI5Selector";
            sSelectorAttributes = oElement.item.identifier.ui5Id + sSelectorExtension;
            sSelectorAttributesStringified = '"' + sSelectorAttributes + '"';
            oSelectorUI5 = {
                own: {
                    id: new RegExp(oElement.item.identifier.ui5Id + "$").toString()
                }
            };
        } else if (sSelectType === "ATTR") {
            sSelector = "UI5Selector";
            var aAttributes = oElement.attributeFilter;
            if (sSelectorExtension) {
                $.extend(true, oScope, {
                    domChildWith: sSelectorExtension
                });
            }

            for (var i = 0; i < aAttributes.length; i++) {
                var oAttribute = aAttributes[i];
                var oItemLocal = this._attributeTypes[oAttribute.attributeType].getItem(oItem);
                var oSpec = this._getValueSpec(oAttribute, oItemLocal);
                if (oSpec === null) {
                    continue;
                }

                this._convertValueSpecToUI5(oSpec, oSelectorUI5, oAttribute, oItemLocal);
                if (oItemLocal.defaultInteraction) {
                    oSelectorUI5.interaction = oItemLocal.defaultInteraction;
                }

                //extent the current local scope with the code extensions..x
                var oScopeLocal = this._attributeTypes[oAttribute.attributeType].getScope(oScope);
                $.extend(true, oScopeLocal, oSpec.code(oAttribute.criteriaValue));
            }


            sSelectorAttributes = oScope;
            sSelectorAttributesStringified = CodeHelper._getSelectorToJSONString(oScope); //JSON.stringify(oScope);
            sSelectorAttributesBtf = JSON.stringify(oScope, null, 2);
        }

        return {
            selectorAttributes: sSelectorAttributes,
            selectorAttributesStringified: sSelectorAttributesStringified ? sSelectorAttributesStringified : sSelectorAttributes,
            selectorAttributesBtf: sSelectorAttributesBtf,
            selector: sSelector,
            selectorUI5: oSelectorUI5
        };
    };

    TestHandler.prototype._getValueSpec = function (oLine, oItem) {
        var aCriteriaSettings = this._criteriaTypes[oLine.criteriaType].criteriaSpec(oItem);
        for (var j = 0; j < aCriteriaSettings.length; j++) {
            if (aCriteriaSettings[j].subCriteriaType === oLine.subCriteriaType) {
                return aCriteriaSettings[j];
            }
        }
        return null;
    };

    TestHandler.prototype._getOwnerComponent = function (oItem) {
        var sCurrentComponent = "";
        var oParent = oItem;
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }
        return sCurrentComponent;
    };

    TestHandler.prototype._getUi5LocalId = function (oItem) {
        var sId = oItem.getId();
        if (sId.lastIndexOf("-") !== -1) {
            return sId.substr(sId.lastIndexOf("-") + 1);
        }
        return sId;
    };

    TestHandler.prototype._getUi5Id = function (oItem) {
        //remove all component information from the control
        var oParent = oItem;
        var sCurrentComponent = "";
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }
        if (!sCurrentComponent.length) {
            return oItem.getId();
        }

        var sId = oItem.getId();
        sCurrentComponent = sCurrentComponent + "---";
        if (sId.lastIndexOf(sCurrentComponent) !== -1) {
            return sId.substr(sId.lastIndexOf(sCurrentComponent) + sCurrentComponent.length);
        }
        return sId;
    };

    TestHandler.prototype.onSelectItem = function (oEvent) {
        var oObj = oEvent.getSource().getBindingContext("viewModel").getObject();
        Communication.fireEvent("selectItem", {
            element: oObj.ui5AbsoluteId ? oObj.ui5AbsoluteId : oObj.identifier.ui5AbsoluteId
        });
    };

    TestHandler.prototype.onUpdatePreview = function () {
        this._updatePreview();
    };

    TestHandler.prototype.onTypeChange = function () {
        this.byId("atrElementsPnl").setExpanded(false);
        this._adjustAttributeDefaultSetting(this._oModel.getProperty("/element/item")).then(function (resolve, reject) {
            //if we are within support assistant mode, run it at least once..
            if (this._oModel.getProperty("/element/property/type") === "SUP") {
                this._runSupportAssistantForSelElement();
            }

            //update preview
            this._updatePreview();
        }.bind(this));
    };

    TestHandler.prototype._suspendPerformanceBindings = function () {
        this.byId("idAttributeTable").getBinding("items").suspend();
        this.byId("idAssertionTable").getBinding("items").suspend();
        this.byId("tblIdentifiedElements").getBinding("items").suspend();
    };

    TestHandler.prototype._resumePerformanceBindings = function () {
        this.byId("idAttributeTable").getBinding("items").resume();
        this.byId("idAssertionTable").getBinding("items").resume();
        this.byId("tblIdentifiedElements").getBinding("items").resume();
        this.byId("attrObjectStatus").getBinding("text").refresh(true);
    };

    TestHandler.prototype._getPropertiesInArray = function (oObj) {
        var i = 0;
        for (var sAttr in oObj) {
            if (sAttr.indexOf("_") === 0) {
                continue;
            }
            i += 1;
        }
        return i;
    };

    TestHandler.prototype._setItem = function (oItem) {
        this._suspendPerformanceBindings();

        if (oItem.aggregationArray) {
            oItem.aggregation = {};
            for (var i = 0; i < oItem.aggregationArray.length; i++) {
                oItem.aggregation[oItem.aggregationArray[i].name] = oItem.aggregationArray[i];
            }
        }
        this._oModel.setProperty("/element/item", oItem);
        this._oModel.setProperty("/element/attributeFilter", []);
        this._oModel.setProperty("/element/assertFilter", []);

        this._adjustPreferredAccess(oItem);
        this._setValidAttributeTypes();
        this._adjustDefaultSettings(oItem).then(function () {
            this._updateValueState(oItem);
            this._updateSubActionTypes(true);
            this._updatePreview();

            this._resumePerformanceBindings();
        }.bind(this));
    };

    TestHandler.prototype._setValidAttributeTypes = function (oItem) {
        var oItem = this._oModel.getProperty("/element/item");
        var aTypes = this.getModel('constants').getProperty("/attrType");
        var aAcceptable = [];
        for (var i = 0; i < aTypes.length; i++) {
            if (this._attributeTypes[aTypes[i].key]) {
                var oCtrl = this._attributeTypes[aTypes[i].key].getItem(oItem);
                if (oCtrl && oCtrl.identifier.ui5Id.length > 0) {
                    aAcceptable.push(aTypes[i]);
                }
            }
        }
        this._oModel.setProperty("/dynamic/attrType", aAcceptable);
    };

    TestHandler.prototype._getMergedClassArray = function (oItem) {
        var aClassArray = this._getClassArray(oItem);
        var oReturn = { defaultAction: { "": "" }, preferredType: "ACT", askForBindingContext: false, preferredProperties: [], defaultInteraction: null, defaultBlur: false, defaultEnter: false, cloned: false, defaultAttributes: [], actions: {} };
        //merge from button to top (while higher elements are overwriting lower elements)
        for (var i = 0; i < aClassArray.length; i++) {
            var oClass = aClassArray[i];
            oReturn.actions = oReturn.actions ? oReturn.actions : [];
            if (!oClass.defaultAction) {
                oClass.defaultAction = [];
            } else if (typeof oClass.defaultAction === "string") {
                oClass.defaultAction = [{
                    domChildWith: "", action: oClass.defaultAction
                }];
            }

            oReturn.preferredType = typeof oClass.preferredType !== "undefined" ? oClass.preferredType : oReturn.preferredType;
            oReturn.defaultEnter = typeof oClass.defaultEnter !== "undefined" ? oClass.defaultEnter : null;
            oReturn.defaultBlur = typeof oClass.defaultBlur !== "undefined" ? oClass.defaultBlur : null;
            oReturn.defaultInteraction = typeof oClass.defaultInteraction !== "undefined" ? oClass.defaultInteraction : null;
            oReturn.cloned = oClass.cloned === true ? true : oReturn.cloned;
            oReturn.preferredProperties = oReturn.preferredProperties.concat(oClass.preferredProperties ? oClass.preferredProperties : []);
            var aElementsAttributes = [];

            for (var j = 0; j < oClass.defaultAction.length; j++) {
                oReturn.defaultAction[oClass.defaultAction[j].domChildWith] = oClass.defaultAction[j];
            }

            if (typeof oClass.defaultAttributes === "function") {
                aElementsAttributes = oClass.defaultAttributes(oItem);
            } else if (oClass.defaultAttributes) {
                aElementsAttributes = oClass.defaultAttributes;
            }
            oReturn.defaultAttributes = oReturn.defaultAttributes.concat(aElementsAttributes);

            oReturn.askForBindingContext = typeof oClass.askForBindingContext !== "undefined" && oReturn.askForBindingContext === false ? oClass.askForBindingContext : oReturn.askForBindingContext;
            for (var sAction in oClass.actions) {
                if (typeof oReturn.actions[sAction] === "undefined") {
                    oReturn.actions[sAction] = oClass.actions[sAction];
                } else {
                    for (var j = 0; j < oClass.actions[sAction].length; j++) {
                        //remove all elements, with the same domChildWith, higher elements are more descriptive..
                        var aExisting = oReturn.actions[sAction].filter(function (e) { return e.domChildWith === oClass.actions[sAction][j].domChildWith; });
                        if (aExisting.length) {
                            aExisting[0] = oClass.actions[sAction][j];
                        } else {
                            oReturn.actions[sAction].push(oClass.actions[sAction][j]);
                        }
                    }
                }
            }
        }
        return oReturn;
    };

    TestHandler.prototype._getClassArray = function (oItem) {
        var oMetadata = oItem.classArray;
        var aReturn = [];
        for (var i = 0; i < oItem.classArray.length; i++) {
            var sClassName = oItem.classArray[i].elementName;
            if (this._oElementMix[sClassName]) {
                aReturn.unshift(this._oElementMix[sClassName]);
            }
        }
        return $.extend(true, [], aReturn);
    };

    TestHandler.prototype._adjustDefaultSettings = function (oItem) {
        return new Promise(function (resolve, reject) {
            var oMerged = this._getMergedClassArray(oItem);

            var sStringDomNodeOriginal = oItem.identifier.domIdOriginal.substr(oItem.identifier.ui5AbsoluteId.length);
            if (oMerged.defaultAction[sStringDomNodeOriginal]) {
                this._oModel.setProperty("/element/property/actKey", oMerged.defaultAction[sStringDomNodeOriginal].action);
                this._oModel.setProperty("/element/property/domChildWith", sStringDomNodeOriginal);
            } else {
                this._oModel.setProperty("/element/property/actKey", oMerged.defaultAction[""].action);
                this._oModel.setProperty("/element/property/domChildWith", "");
            }

            if (oItem.identifier.idGenerated === true || oItem.identifier.idCloned === true) {
                this._oModel.setProperty("/element/property/selectItemBy", "ATTR");
            } else {
                this._oModel.setProperty("/element/property/selectItemBy", "UI5");
            }

            if (typeof oMerged.defaultBlur !== "undefined" && oMerged.defaultBlur !== null) {
                this._oModel.setProperty("/element/property/actionSettings/blur", oMerged.defaultBlur);
            }

            if (typeof oMerged.preferredType !== "undefined" && oMerged.preferredType !== null) {
                this._oModel.setProperty("/element/property/type", oMerged.preferredType)
            }

            if (typeof oMerged.defaultEnter !== "undefined" && oMerged.defaultEnter !== null) {
                this._oModel.setProperty("/element/property/actionSettings/enter", oMerged.defaultEnter);
            }

            //try to find the best name..
            //always: add the local Element Name..
            var sName = oItem.metadata.elementName.split(".").splice(-1).pop();
            if (oItem.binding && oItem.binding.value && oItem.binding.value.path) {
                sName = oItem.binding.value.path + sName;
            } else if (oItem.label && oItem.label.binding && oItem.label.binding.text && oItem.label.binding.text.static === true) {
                sName = oItem.label.binding.text.path + sName;
            }
            sName = sName.substr(0, 1).toLowerCase() + sName.substr(1);

            //check if the technical name is already given
            this._oModel.setProperty("/element/property/technicalName", sName);

            this._getFoundElements().then(function (aReturn) {
                if (this._oModel.getProperty("/element/property/selectItemBy") === "UI5" && aReturn.length > 1) {
                    this._oModel.setProperty("/element/property/selectItemBy", "ATTR"); //change to attributee in case id is not sufficient..
                }

                this._findBestAttributeDefaultSetting(oItem, false).then(function () {
                    //adjust DOM node for action type "INP"..
                    this._adjustDomChildWith(oItem);
                    resolve();
                }.bind(this));
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._findBestAttributeDefaultSetting = function (oItem, bForcePopup) {
        return new Promise(function (resolve, reject) {
            this._adjustAttributeDefaultSetting(oItem).then(this._getFoundElements.bind(this)).then(function (aReturn) {
                //in case we still have >1 item - change to
                if (this._oModel.getProperty("/element/property/selectItemBy") === "ATTR" &&
                    ((aReturn.length > 1 && this._oModel.getProperty("/element/property/type") === 'ACT') || bForcePopup === true)) {
                    //ok - we are still not ready - let's check if we are any kind of item, which is requiring the user to ask for binding context information..
                    //work on our binding context information..
                    var oItem = this._oModel.getProperty("/element/item");
                    var aList = [];
                    if (!jQuery.isEmptyObject(oItem.binding)) {
                        for (var sAttr in oItem.binding) {
                            if (typeof oItem.binding[sAttr].path !== "object") {
                                aList.push({
                                    type: "BNDG",
                                    typeTxt: "Binding",
                                    bdgPath: sAttr,
                                    attribute: sAttr,
                                    importance: oItem.uniquness.binding[sAttr],
                                    value: oItem.binding[sAttr].path,
                                    valueToString: oItem.binding[sAttr].path
                                });
                            }
                        }
                    }
                    if (!jQuery.isEmptyObject(oItem.property)) {
                        for (var sAttr in oItem.property) {
                            if (typeof oItem.property[sAttr] !== "object") {
                                aList.push({
                                    type: "ATTR",
                                    typeTxt: "Property",
                                    bdgPath: sAttr,
                                    attribute: sAttr,
                                    importance: oItem.uniquness.property[sAttr],
                                    value: oItem.property[sAttr],
                                    valueToString: oItem.property[sAttr].toString ? oItem.property[sAttr].toString() : oItem.property[sAttr]
                                });
                            }
                        }
                    }
                    if (!jQuery.isEmptyObject(oItem.context)) {
                        for (var sModel in oItem.context) {
                            for (var sAttribute in oItem.context[sModel]) {
                                if (typeof oItem.context[sModel][sAttribute] !== "object") {
                                    aList.push({
                                        type: "BDG",
                                        typeTxt: "Context",
                                        bdgPath: sModel + "/" + sAttribute,
                                        attribute: sAttribute,
                                        value: oItem.context[sModel][sAttribute],
                                        importance: oItem.uniquness.context[sModel][sAttribute],
                                        valueToString: oItem.context[sModel][sAttribute].toString ? oItem.context[sModel][sAttribute].toString() : oItem.context[sModel][sAttribute]
                                    });
                                }
                            }
                        }
                    }
                    var oMerged = this._getMergedClassArray(oItem);
                    this._oModel.setProperty("/element/itemCloned", oMerged.cloned);
                    if (oMerged.cloned === true) {
                        aList = aList.sort(function (aObj, bObj) {
                            if (aObj.importance <= bObj.importance) {
                                return 1;
                            }
                            return -1;
                        });
                    }

                    for (var i = 0; i < aList.length; i++) {
                        aList[i].numberState = "Error";
                        if (aList[i].importance >= 80) {
                            aList[i].numberState = "Success";
                        } else if (aList[i].importance >= 60) {
                            aList[i].numberState = "Warning";
                        }
                    }
                    if (aList.length > 0) {
                        this._oModel.setProperty("/element/possibleContext", aList);
                        this._oTableContext.removeSelections();
                        this._oSelectDialog.setModel(this._oModel, "viewModel")
                        this._oSelectDialog.open();
                    }
                }

                resolve();
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._adjustPreferredAccessItem = function (oItem) {
        if (!oItem) {
            return null;
        }
        var oMerged = this._getMergedClassArray(oItem);
        if (oMerged.defaultInteraction) {
            oItem.defaultInteraction = oMerged.defaultInteraction;
        }
        return oItem;
    };

    TestHandler.prototype._adjustPreferredAccess = function (oItem) {
        this._adjustPreferredAccessItem(oItem);
        this._adjustPreferredAccessItem(oItem.parent);
        this._adjustPreferredAccessItem(oItem.parentL2);
        this._adjustPreferredAccessItem(oItem.parentL3);
        this._adjustPreferredAccessItem(oItem.parentL4);
        this._adjustPreferredAccessItem(oItem.label);
        this._adjustPreferredAccessItem(oItem.itemdata);
    };

    TestHandler.prototype._adjustDomChildWith = function (oItem) {
        var oMerged = this._getMergedClassArray(oItem);
        //check if there is any preferred action, and that action is actually available..
        var oPropAction = oMerged.actions[this._oModel.getProperty("/element/property/actKey")];
        if (oPropAction) {
            var sPrefDomChildWith = "";
            for (var i = 0; i < oPropAction.length; i++) {
                if (oPropAction[i].preferred === true) {
                    sPrefDomChildWith = oPropAction[i].domChildWith;
                    break;
                }
            }
            if (sPrefDomChildWith.length) {
                this._oModel.setProperty("/element/property/domChildWith", sPrefDomChildWith);
                return;
            }
        }

        var sStringDomNodeOriginal = this._oModel.getProperty("/element/property/domChildWith");
        if (this._oModel.getProperty("/element/property/actKey") === "TYP") {
            //find the first "input" or "textarea" element type
            for (var i = 0; i < oItem.children.length; i++) {
                if (oItem.children[i].isInput === true) {
                    this._oModel.setProperty("/element/property/domChildWith", oItem.children[i].domChildWith);
                    break;
                }
            }
        } else {
            //set to root, in case we are not allowed to work on that node..
            if (!oMerged.defaultAction[sStringDomNodeOriginal]) {
                this._oModel.setProperty("/element/property/domChildWith", "");
            }
        }
    };

    TestHandler.prototype._adjustAttributeDefaultSetting = function (oItem) {
        return new Promise(function (resolve, reject) {
            var sProp = this._oModel.getProperty("/element/property/selectItemBy");
            if (sProp != "ATTR") {
                this._oModel.setProperty("/element/attributeFilter", []);
                resolve();
            } else {
                this._findAttribute(oItem).then(resolve, reject); //generate standard, or "best fitting" (whatever that is :-)
            }
        }.bind(this));
    };

    TestHandler.prototype._updateValueState = function (oItem) {
        var sState = ValueState.None;
        var sStateText = "";
        if (oItem.identifier.idGenerated === true) {
            sState = ValueState.Error;
            sStateText = "The ID is most likely generated, and will not be constant. Do not use that ID (or provide a static id)."
        } else if (oItem.identifier.idCloned === true) {
            sState = ValueState.Warning;
            sStateText = "The ID is most likely referring to a clone, and might not be constant. Do not use that ID."
        }
        this._oModel.setProperty("/idQualityState", sState);
        this._oModel.setProperty("/idQualityStateText", sStateText);
    };

    TestHandler.prototype.onAddAttribute = function (oEvent) {
        this._add("/element/attributeFilter");
        this.byId("atrElementsPnl").setExpanded(true);
        this._updatePreview();
    };

    TestHandler.prototype.onRemoveAttribute = function (oEvent) {
        var aContext = this.byId("idAttributeTable").getSelectedContexts();
        this._remove(aContext);
    };

    TestHandler.prototype.onRemoveAssertion = function (oEvent) {
        var aContext = this.byId("idAssertionTable").getSelectedContexts();
        this._remove(aContext);
    };

    TestHandler.prototype.onFindAttribute = function (oEvent) {
        var oItem = this._oModel.getProperty("/element/item");
        this._findBestAttributeDefaultSetting(oItem, true).then(function () {
            this._updatePreview();
        }.bind(this));
    };

    TestHandler.prototype._findAttribute = function (oItem) {
        return new Promise(function (resolve, reject) {
            this._oModel.setProperty("/element/attributeFilter", []);

            var bSufficientForStop = false;
            //(1): we will ALWAYS add the property for metadata (class), as that just makes everyting so much faster and safer..
            this._add("/element/attributeFilter");

            //(2) add our LOCAL Id in case the local id is ok..
            if (oItem.identifier.ui5LocalId && oItem.identifier.localIdClonedOrGenerated === false) {
                this._add("/element/attributeFilter", { attributeType: "OWN", criteriaType: "ID", subCriteriaType: "LID" });
                bSufficientForStop = true;
            }

            this._getFoundElements().then(function (aReturn) {
                if (aReturn.length === 1 && bSufficientForStop === true) { //early exit if possible - the less attributes the better..
                    resolve();
                    return;
                }
                //(3): we add the parent or the parent of the parent id in case the ID is unique..
                if (oItem.parent.identifier.ui5Id.length && oItem.parent.identifier.idGenerated === false && oItem.parent.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", { attributeType: "PRT", criteriaType: "ID", subCriteriaType: "ID" });
                    bSufficientForStop = true;
                } else if (oItem.parentL2.identifier.ui5Id.length && oItem.parentL2.identifier.idGenerated === false && oItem.parentL2.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", { attributeType: "PRT2", criteriaType: "ID", subCriteriaType: "ID" });
                    bSufficientForStop = true;
                } else if (oItem.parentL3.identifier.ui5Id.length && oItem.parentL3.identifier.idGenerated === false && oItem.parentL3.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", { attributeType: "PRT3", criteriaType: "ID", subCriteriaType: "ID" });
                    bSufficientForStop = true;
                } else if (oItem.parentL4.identifier.ui5Id.length && oItem.parentL4.identifier.idGenerated === false && oItem.parentL4.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", { attributeType: "PRT4", criteriaType: "ID", subCriteriaType: "ID" });
                    bSufficientForStop = true;
                }
                var oMerged = this._getMergedClassArray(oItem);
                if (oMerged.cloned === true) {
                    bSufficientForStop = false;
                }

                //(4): now let's go for element specific attributes
                if (oMerged.defaultAttributes && oMerged.defaultAttributes.length > 0) {
                    //add the elements from default attributes and stop.
                    for (var i = 0; i < oMerged.defaultAttributes.length; i++) {
                        this._add("/element/attributeFilter", oMerged.defaultAttributes[i]);
                    }
                }
                this._getFoundElements().then(function (aReturn) {
                    if (aReturn.length === 1) { //early exit if possible - the less attributes the better..
                        resolve();
                        return;
                    }

                    //(5): now add the label text if possible and static..
                    if (oItem.label &&
                        oItem.label.binding && oItem.label.binding.text && oItem.label.binding.text.static === true) {
                        this._add("/element/attributeFilter", { attributeType: "PLBL", criteriaType: "BNDG", subCriteriaType: "text" });
                    }
                    resolve();
                }.bind(this));
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._remove = function (aContext) {
        if (!aContext || aContext.length !== 1) {
            return;
        }
        for (var i = 0; i < aContext.length; i++) {
            var sPath = aContext[i].getPath(); //e.g. /assertion/1/
            sPath = sPath.substr(0, sPath.lastIndexOf("/"));
            var aIndex = aContext[i].getPath().split("/");
            var iIndex = aIndex[aIndex.length - 1];

            var aProp = this._oModel.getProperty(sPath);
            aProp.splice(iIndex, 1);
            this._oModel.setProperty(sPath, aProp);
        }

        this._updatePreview();
        this._check();
    };

    TestHandler.prototype._add = function (sPath, oTemplate) {
        var aAttributes = this._oModel.getProperty(sPath);
        oTemplate = typeof oTemplate === "undefined" ? {} : oTemplate;
        aAttributes.push({
            attributeType: oTemplate.attributeType ? oTemplate.attributeType : "OWN",
            criteriaTypes: [],
            criteriaType: oTemplate.criteriaType ? oTemplate.criteriaType : "MTA",
            subCriteriaType: oTemplate.subCriteriaType ? oTemplate.subCriteriaType : "ELM",
            criteriaValue: "",
            operatorType: oTemplate.operatorType ? oTemplate.operatorType : "EQ"
        });
        this._oModel.setProperty(sPath, aAttributes);
        this._updateAttributeTypes(this._oModel.getContext(sPath + "/" + (aAttributes.length - 1)));
    };

    TestHandler.prototype.onAddAssertion = function (oEvent) {
        //most certainly we want to "overwach" an attribute.. nothing else make too much sense..
        this._add("/element/assertFilter", { attributeType: "OWN", criteriaType: "ATTR", subCriteriaType: "" });

        this._updatePreview();
    };

    TestHandler.prototype.onAttributeTypeChanged = function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext("viewModel");
        this._updateAttributeTypes(oCtx);
        this._updatePreview();
    };

    TestHandler.prototype.onCriteriaTypeChanged = function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext("viewModel");
        this._updateCriteriaType(oCtx);
        this._updatePreview();
    };

    TestHandler.prototype.onSubCriteriaTypeChanged = function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext("viewModel");
        this._updateSubCriteriaType(oCtx);
        this._updatePreview();
    };

    TestHandler.prototype._createActionPopover = function () {
        if (!this._oPopoverAction) {
            this._oPopoverAction = sap.ui.xmlfragment(
                "com.ui5.testing.fragment.PopoverActionSettings",
                this
            );
            this._oPopoverAction.setModel(this._oModel, "viewModel");
            this._oPopoverAction.attachBeforeClose(function () {
                this._updatePreview();
            }.bind(this));
        }
    };

    TestHandler.prototype.onClick = function (oItem, bAssertion) { //todo: assertion
        this._oModel.setProperty("/element", JSON.parse(JSON.stringify(this._oModel.getProperty("/elementDefault"))));
        if (bAssertion === true) {
            this._oModel.setProperty("/element/property/type", "ASS");
        }
        this._oModel.setProperty("/selectMode", true);
        this.byId("atrElementsPnl").setExpanded(false);
        this._bShowCodeOnly = false;
        this._bDialogActive = true;
        this._setItem(oItem);

        //in case we are in "TYP" after opening, set focus to input field..
        var oInput = this.byId("inpTypeText");
        var oConfirm = this.byId("btSave");
        if (this._oModel.getProperty("/element/property/actKey") === "TYP") {
            oInput.focus();

            setTimeout(function () {
                oInput.focus();
            }, 100);
        } else {
            //if rating = 5 --> save
            if (this._oModel.getProperty("/element/ratingOfAttributes") === 5) {
                oConfirm.focus();
            }
        }
    };

    TestHandler.prototype._resetCache = function () {
        oTestGlobalBuffer = {
            fnGetElement: {
                true: {},
                false: {}
            },
            findItem: {},
            fnGetElementInfo: {
                true: {},
                false: {}
            },
            label: null
        };
    };

    TestHandler.prototype.switch = function () {
        this._bActive = this._bActive !== true;
        this._bStarted = this._bActive;
        if (this._bActive === false) {
            //show code after finalizing
            this.showCode();
        }
    };

    TestHandler.prototype.showCode = function (sId) {
        this._bActive = false;
        this._bShowCodeOnly = true;
        this._oModel.setProperty("/selectMode", false);
        this._createDialog();
        this._updatePreview();
        $(".HVRReveal").removeClass('HVRReveal');
    };

    TestHandler.prototype.startFor = function (sId) {
        this._bActive = false;
        var oElement = document.getElementById(sId);
        if (!oElement) {
            return;
        }
        this.onClick(oElement, false);
    };

    TestHandler.prototype._updateAttributeTypes = function (oCtx) {
        var oAttribute = this._oModel.getProperty(oCtx.getPath());
        var oAttributeSettings = this._attributeTypes[oAttribute.attributeType];
        oAttribute.criteriaTypes = oAttributeSettings.criteriaTypes;

        //check if the current criteraType value is valid - if yes, keep it, otherwise reset it..
        if (oAttribute.criteriaTypes.filter(function (e) { return e.criteriaKey === oAttribute.criteriaType; }).length === 0) {
            oAttribute.criteriaType = oAttribute.criteriaTypes[0].criteriaKey;
        }

        this._oModel.setProperty(oCtx.getPath(), oAttribute);

        this._updateCriteriaType(oCtx);
    };

    TestHandler.prototype._updateCriteriaType = function (oCtx) {
        var oAttribute = this._oModel.getProperty(oCtx.getPath());
        var oItem = this._attributeTypes[oAttribute.attributeType].getItem(this._oModel.getProperty("/element/item"));
        if (oItem === null) {
            return;
        }
        var aSubCriteriaSettings = this._criteriaTypes[oAttribute.criteriaType].criteriaSpec(oItem);

        oAttribute.subCriteriaTypes = aSubCriteriaSettings;
        if (oAttribute.subCriteriaTypes.length > 0) {
            if (oAttribute.subCriteriaTypes.filter(function (e) { return e.subCriteriaType === oAttribute.subCriteriaType; }).length === 0) {
                oAttribute.subCriteriaType = oAttribute.subCriteriaTypes[0].subCriteriaType;
            }
        } else {
            oAttribute.subCriteriaType = "";
        }
        //update the value for every single sub critriay type..
        for (var i = 0; i < oAttribute.subCriteriaTypes.length; i++) {
            var sStringTrimmed = oAttribute.subCriteriaTypes[i].value(oItem);
            if (sStringTrimmed === null || typeof sStringTrimmed === "undefined") {
                continue;
            }
            if (typeof sStringTrimmed !== "string") {
                if (!sStringTrimmed.toString) {
                    continue;
                }
                sStringTrimmed = sStringTrimmed.toString();
            }
            var sStringUntrimmed = sStringTrimmed;
            if (sStringTrimmed.length > 15) {
                sStringTrimmed = sStringTrimmed.substring(0, 15) + "(...)";
            }
            oAttribute.subCriteriaTypes[i].calculatedValueUnres = sStringUntrimmed;
            oAttribute.subCriteriaTypes[i].calculatedValue = sStringTrimmed;
        }

        this._oModel.setProperty(oCtx.getPath(), oAttribute);

        this._updateSubCriteriaType(oCtx);
    };

    TestHandler.prototype._getAttributeRating = function (oAttr) {
        return new Promise(function (resolve, reject) {
            var aAttributes = this._oModel.getProperty("/element/attributeFilter");
            var aAssertions = this._oModel.getProperty("/element/assertFilter");
            var oItem = this._oModel.getProperty("/element/item");
            var oElement = this._oModel.getProperty("/element");
            var iGrade = 5; //we are starting with a 5..
            var aMessages = [];
            var sType = oElement.property.type; // SEL | ACT | ASS
            var sAssType = oElement.property.assKey; // SEL | ACT | ASS
            var sSelectType = oElement.property.selectItemBy; //DOM | UI5 | ATTR
            var sExpectedCount = this._oModel.getProperty("/element/property/assKeyMatchingCount");
            this._getFoundElements().then(function (aFound) {
                if (oItem.identifier) {
                    if (oItem.identifier.idGenerated == true && sSelectType === "UI5") {
                        aMessages.push({
                            type: "Error",
                            title: "ID generated",
                            subtitle: "Used identifer is cloned (not static)",
                            description: "You are probably using a cloned ID which will be unstable.\nPlease provide a static id if possible, or use attribute Selectors."
                        });
                    } else if (oItem.identifier.idCloned === true && sSelectType === "UI5") {
                        iGrade = 2;
                        aMessages.push({
                            type: "Error",
                            title: "ID generated",
                            subtitle: "Used identifer is generated (not static)",
                            description: "You are probably using a cloned ID which will be unstable.\nPlease provide a static id if possible, or use attribute Selectors."
                        });
                    }
                }
                if (aFound.length === 0 && (sType === "ACT" || (sAssType === "EXS" && sType === "ASS"))) {
                    iGrade = 1;
                    aMessages.push({
                        type: "Error",
                        title: "No Item Found",
                        subtitle: "Your Action will not be executed",
                        description: "You have maintained an action to be executed. For the selected attributes/id however no item is found in the current screen. The action will therefore not work."
                    });
                } else if (aFound.length > 1 && sType === "ACT") {
                    iGrade = 1;
                    aMessages.push({
                        type: "Error",
                        title: ">1 Item Found",
                        subtitle: "Your Action will be executed randomly",
                        description: "Your selector is returning " + aFound.length + " items. The action will be executed on the first found. That is normally an error - only in very few cases (e.g. identical launchpad tiles), that might be acceptable."
                    });
                } else if (aFound.length !== sExpectedCount && sType === "ASS" && sAssType == "MTC") {
                    iGrade = 1;
                    aMessages.push({
                        type: "Warning",
                        title: "Assert will fail",
                        subtitle: aFound.length + " items found differs from " + sExpectedCount,
                        description: "Your selector is returning " + aFound.length + " items. The maintained assert will fail, as the expected value is different"
                    });
                }

                //check the attributes.. for attributes we are at least expecting ONE element with a static id..
                var bFound = false;
                if (sSelectType === "ATTR") {
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].subCriteriaType === "LID" || aAttributes[i].subCriteriaType === "ID") {
                            bFound = true;
                            break;
                        }
                    }
                    if (bFound === false) {
                        iGrade = iGrade - 1;
                        aMessages.push({
                            type: "Warning",
                            title: "No ID in Properties",
                            subtitle: "At least one identifier is strongly recommended",
                            description: "Please provide a identifier - at least one of the parent levels, which is static."
                        });
                    }

                    bFound = false;
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].subCriteriaType === "LID" || aAttributes[i].subCriteriaType === "ID") {
                            //check if the corresponding id is generic.. if yes, we also have an issue..
                            var oSubScope = this._attributeTypes[aAttributes[i].attributeType].getScope(oItem);
                            if (oSubScope.metadata && (oSubScope.metadata.idCloned === true || oSubScope.metadata.idGenerated === true)) {
                                bFound = true;
                                break;
                            }
                        }
                    }
                    if (bFound === true) {
                        iGrade = iGrade - 2;
                        aMessages.push({
                            type: "Warning",
                            title: "Generic or Cloned ID",
                            subtitle: "You are using a generic or cloned ID",
                            description: "One of the attributes is using a generic or cloned identifier."
                        });
                    }

                    bFound = false;
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].criteriaType === "BDG") {
                            bFound = true;
                            break;
                        }
                    }
                    if (bFound === true) {
                        aMessages.push({
                            type: "Information",
                            title: "Binding Context",
                            subtitle: "Is the binding context static?",
                            description: "When using a binding context, please ensure that the value behind is either static, or predefined by your test."
                        });
                    }
                    bFound = false;
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].criteriaType === "ATTR") {
                            if (aAttributes[i].subCriteriaType === "title" || aAttributes[i].subCriteriaType === "text") {
                                bFound = true;
                            }
                            break;
                        }
                    }
                    if (bFound === true) {
                        iGrade = iGrade - 1;
                        aMessages.push({
                            type: "Warning",
                            title: "Text Attribute",
                            subtitle: "Is the attribute static?",
                            description: "You are binding against a text/title property. Are you sure that this text is not language specific and might destroy the test in other languages? Use Binding Path for text for i18n texts instead."
                        });
                    }
                }

                //check of assertions..
                if (sType === "ASS" && sAssType === "ATTR") {
                    //check if any have assertionOK = false..
                    bFound = false;
                    for (var i = 0; i < aAssertions.length; i++) {
                        if (aAssertions[i].assertionOK === false) {
                            bFound = true;
                        }
                    }

                    if (bFound === true) {
                        this.byId("pnlFoundElements").setExpanded(true);
                        iGrade = 1;
                        aMessages.push({
                            type: "Error",
                            title: "Assert is failing",
                            subtitle: "At least one assert is failing",
                            description: "At least one of the maintained assert attribute checks is failing. This also wont work within the actual test run later on. Please fix that."
                        });
                    }
                }

                if (sType === "SUP") {
                    //check if there are any critical issues (maybe in future also, for certain issues or contexts.. let's see)
                    var aIssues = this._oModel.getProperty("/element/supportAssistantResult");
                    for (var j = 0; j < aIssues.length; j++) {
                        if (aIssues[j].severity === "High") {
                            iGrade = 1;
                            this.byId("pnlSupAssistantRule").setExpanded(true);
                            aMessages.push({
                                type: "Error",
                                title: "Support Assistants is failing",
                                subtitle: "At least one rule is failing",
                                description: "At least one of the maintained rules is failing - Adding this step doesn't make sense, as anyways it will fail."
                            });
                            break;
                        }
                    }
                }

                if (iGrade < 0) {
                    iGrade = 0;
                }
                this._oModel.setProperty("/element/messages", aMessages);
                this._oModel.setProperty("/element/ratingOfAttributes", iGrade);
                resolve({
                    rating: iGrade,
                    messages: aMessages
                });
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._updateSubCriteriaType = function (oCtx) {
        var oAttribute = this._oModel.getProperty(oCtx.getPath());
        var oItem = this._attributeTypes[oAttribute.attributeType].getItem(this._oModel.getProperty("/element/item"));

        //we need to initialize the default value, based on the subCriteriaType
        var aCriteriaSettings = this._criteriaTypes[oAttribute.criteriaType].criteriaSpec(oItem);
        for (var i = 0; i < aCriteriaSettings.length; i++) {
            if (aCriteriaSettings[i].subCriteriaType === oAttribute.subCriteriaType) {
                oAttribute.criteriaValue = aCriteriaSettings[i].value(oItem);
                break;
            }
        }

        this._oModel.setProperty(oCtx.getPath(), oAttribute);
    };

    TestHandler.prototype._lengthStatusFormatter = function (iLength) {
        return "Success";
    };

    TestHandler.prototype._getCriteriaTypes = function () {
        this._criteriaTypes = GlobalSettings.getCriteriaTypes();
        this._attributeTypes = GlobalSettings.getAttributeTypes();

        this._defineElementBasedActions();
    };

    TestHandler.prototype._defineElementBasedActions = function () {
        this._oElementMix = GlobalSettings.getElementMix();
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ////BEGIN STACK UI5SELECTOR
    ////CODE BELOW IS NOT ALLOWED TO ACCESS ANY THIS METHOD
    ////The code is 1:1 copied to the corresponding UI5Selector Plugin
    ////Copying is not really nice, due to different languages (!) (typescript vs js) in the exceution phase
    ////all other approaches would just take unreasonabliy more time and effort
    ///METHOD: SEARCH
    //////////////////////////////////////////////////////////////////////////////////////////////////

    return TestHandler;
});