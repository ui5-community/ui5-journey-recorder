sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    "sap/m/MessageBox",
    "com/ui5/testing/model/ConnectionMessages",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/CodeHelper",
    "com/ui5/testing/model/Utils"
], function (Controller,
    JSONModel,
    Fragment,
    ValueState,
    MessagePopover,
    MessageItem,
    MessageBox,
    ConnectionMessages,
    Connection,
    RecordController,
    CodeHelper,
    Utils) {
    "use strict";

    return Controller.extend("com.ui5.testing.controller.TestStep", {
        _oPopoverAction: null,
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
            code: "",
            elements: [],
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
                supportAssistantResult: {}
            },
            dynamic: {
                attrType: []
            },
            statics: {
                supportRules: []
            },
            ratingOfAttributes: 3,
            codes: [],
            idQualityState: ValueState.None,
            idQualityStateText: ""
        }),
        _criteriaTypes: null,
        _attributeTypes: null,
        _oElementMix: null,
        _sTestId: "",

        /**
         *
         */
        onInit: function () {
            this._criteriaTypes = Utils.getCriteriaTypes();
            this._attributeTypes = Utils.getAttributeTypes();
            this._oElementMix = Utils.getElementMix();

            this._initMessagePopovers();
            this.getView().setModel(this._oModel, "viewModel");

            this.getRouter().getRoute("elementCreate").attachPatternMatched(this._onObjectMatched, this);
            this.getRouter().getRoute("elementCreateQuick").attachPatternMatched(this._onObjectMatchedQuick, this);
            this.getRouter().getRoute("elementDisplay").attachPatternMatched(this._onObjectMatchedDisplay, this);
            //sap.ui.getCore().getEventBus().subscribe("RecordController", "windowFocusLost", this._recordStopped, this);
        },

        // #region Routes

        /**
         *
         * @param {*} oEvent
         */
        _onObjectMatched: function (oEvent) {
            this.getModel('viewModel').setProperty('/blocked', false);
            this.getModel('viewModel').setProperty('/isInjected', RecordController.getInstance().isInjected());
            this._sTestId = oEvent.getParameter("arguments").TestId;
            this._oModel.setProperty("/quickMode", false);
            var oItem = RecordController.getInstance().getCurrentElement();
            if (!oItem || JSON.stringify(oItem) === "{}") {
                this.getRouter().navTo("start");
                return;
            }
            this.initializeTestElement(oItem);
        },

        /**
         *
         * @param {*} oEvent
         */
        _onObjectMatchedQuick: function (oEvent) {
            this.getModel('viewModel').setProperty('/blocked', false);
            this.getModel('viewModel').setProperty('/isInjected', RecordController.getInstance().isInjected());
            this._sTestId = oEvent.getParameter("arguments").TestId;
            this._oModel.setProperty("/quickMode", true);
            var oItem = RecordController.getInstance().getCurrentElement();
            if (!oItem || JSON.stringify(oItem) === "{}") {
                this.getRouter().navTo("start");
                return;
            }
            this.initializeTestElement(oItem);
        },

        /**
         *
         * @param {*} oEvent
         */
        _onObjectMatchedDisplay: function (oEvent) {
            this._sTestId = oEvent.getParameter("arguments").TestId;
            this._sElementId = oEvent.getParameter("arguments").ElementId;

            this.getModel('viewModel').setProperty('/element', RecordController.getInstance().getTestElementByIdx(this._sElementId));
            this.getModel('viewModel').setProperty('/blocked', true);
            this.getModel('viewModel').setProperty('/isInjected', RecordController.getInstance().isInjected());
            this._setValidAttributeTypes();
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);

            if (this.getModel('viewModel').setProperty('/isInjected')) {
                this.getModel('viewModel').setProperty('/blocked', false);
            }
        },

        // #endregion

        // #region Event handling regarding view

        /**
         *
         * @param {*} oEvent
         */
        onShowActionSettings: function (oEvent) {

            if (!this._oPopoverAction) {

                // save source so it does not get lost in the upcoming closures
                var oSource = oEvent.getSource();

                Fragment.load({
                    name: "com.ui5.testing.fragment.PopoverActionSettings",
                    controller: this
                }).then(function (oPopoverAction) {
                    this._oPopoverAction = oPopoverAction;
                    this._oPopoverAction.setModel(this._oModel, "viewModel");
                    this._oPopoverAction.attachBeforeClose(function () {
                        this._updatePreview();
                    }, this);

                    this._oPopoverAction.openBy(oSource);

                }.bind(this));

            } else {

                this._oPopoverAction.openBy(oEvent.getSource());

            }

        },

        onNavBack: function () {
            this.onCancelStep();
        },

        /**
         *
         */
        onCancelStep: function () {
            this.getRouter().navTo("TestDetails", {
                TestId: this._sTestId
            }, true);
            RecordController.getInstance().startRecording();
        },

        /**
         *
         */
        onStopFromQuick: function () {
            RecordController.getInstance().stopRecording();
            window.close();
        },

        /**
         *
         */
        onNewStepFromQuick: function () {
            this.getRouter().navTo("TestDetailsCreateQuick", {}, true);
        },

        /**
         *
         */
        onSave: function () {
            this.byId("btSaveHeader").setBusy(true);
            this.byId("btSaveFooter").setBusy(true);

            this._save()
                .then(function () {

                    this.byId("btSaveHeader").setBusy(false);
                    this.byId("btSaveFooter").setBusy(false);

                    //navigate backwards to the screen, and immediately start recording..
                    this.getRouter().navTo("TestDetails", {
                        TestId: this._sTestId
                    }, true);
                    RecordController.getInstance().startRecording();
                }.bind(this))
                .catch(function () {
                    this.byId("btSaveHeader").setBusy(false);
                    this.byId("btSaveFooter").setBusy(false);
                }.bind(this));
        },

        /**
         *
         * @param {*} oEvent
         */
        onUpdateAction: function (oEvent) {
            this._updateSubActionTypes();
            this._adjustDomChildWith(this._oModel.getProperty("/element/item"));
            this._updatePreview();
        },

        /**
         *
         */
        onExplain: function (oEvent) {
            this._oMessagePopover.toggle(oEvent.getSource());
        },

        /**
         *
         * @param {*} oEvent
         */
        onShowAssertionIssue: function (oEvent) {
            this._oMessagePopoverAssert.setBindingContext(oEvent.getSource().getBindingContext("viewModel"), "viewModel");
            this._oMessagePopoverAssert.toggle(oEvent.getSource());
        },

        /**
         *
         */
        onRunSupportAssistant: function () {
            this._runSupportAssistant();
        },

        /**
         * Toggle panel by clicking its header toolbar.
         *
         * @param {*} oEvent the event triggered by the header-toolbar click
         */
        onExpandControl: function (oEvent) {
            var oPanel = oEvent.getSource().getParent();
            oPanel.setExpanded(!oPanel.getExpanded());
        },

        /**
         *
         */
        onSelectItem: function (oEvent) {
            var oObj = oEvent.getSource().getBindingContext("viewModel").getObject();
            ConnectionMessages.selectItem(Connection.getInstance(), {
                element: oObj.ui5AbsoluteId ? oObj.ui5AbsoluteId : oObj.identifier.ui5AbsoluteId
            });
        },

        /**
         *
         */
        onUpdatePreview: function () {
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        /**
         *
         */
        onTypeChange: function () {
            this.byId("atrElementsPnl").setExpanded(false);
            //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
            //keep the filter attributes selected before and reapply them afterwards..
            var aFilter = this._oModel.getProperty("/element/attributeFilter");
            this._adjustAttributeDefaultSetting(this._oModel.getProperty("/element/item")).then(function (resolve, reject) {
                //if we are within support assistant mode, run it at least once..
                if (this._oModel.getProperty("/element/property/type") === "SUP") {
                    this._runSupportAssistant();
                }
                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                this._oModel.setProperty("/element/attributeFilter", aFilter);

                //update preview
                Promise.all([
                    this._updatePreview(),
                    this._validateSelectedItemNumber()
                ]);
            }.bind(this));
        },

        /**
         *
         */
        onAddAttribute: function (oEvent) {
            this._add("/element/attributeFilter");
            this.byId("atrElementsPnl").setExpanded(true);
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        /**
         *
         */
        onRemoveAttribute: function (oEvent) {
            var aContext = this.byId("idAttributeTable").getSelectedContexts();
            this._remove(aContext);
        },

        /**
         *
         */
        onRemoveAssertion: function (oEvent) {
            var aContext = this.byId("idAssertionTable").getSelectedContexts();
            this._remove(aContext);
        },

        /**
         *
         */
        onFindAttribute: function (oEvent) {
            var oItem = this._oModel.getProperty("/element/item");
            this._findBestAttributeDefaultSetting(oItem, true).then(function () {
                Promise.all([
                    this._updatePreview(),
                    this._validateSelectedItemNumber()
                ]);
            }.bind(this));
        },

        /**
         *
         */
        onAddAssertion: function (oEvent) {
            //most certainly we want to watch an attribute.. nothing else make too much sense..
            this._add("/element/assertFilter", {
                attributeType: "OWN",
                criteriaType: "ATTR",
                subCriteriaType: ""
            });

            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        /**
         *
         */
        onAttributeTypeChanged: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("viewModel");
            this._updateAttributeTypes(oCtx);
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        /**
         *
         */
        onCriteriaTypeChanged: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("viewModel");
            this._updateCriteriaType(oCtx);
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        /**
         *
         */
        onSubCriteriaTypeChanged: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("viewModel");
            this._updateSubCriteriaType(oCtx);
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        /**
         *
         * @param {*} oEvent
         */
        onChangeCriteriaValue: function (oEvent) {
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
            Promise.all([
                this._updatePreview(),
                this._validateSelectedItemNumber()
            ]);
        },

        //#region Element initialization and updating

        /**
         *
         * @param {object} oItem the item to use for test recording
         * @param {boolean} bAssertion marker if the Action is an assertion
         */
        initializeTestElement: function (oItem, bAssertion) {
            this._oModel.setProperty("/element", JSON.parse(JSON.stringify(this._oModel.getProperty("/elementDefault"))));
            if (bAssertion === true) {
                this._oModel.setProperty("/element/property/type", "ASS");
            }
            this.byId("atrElementsPnl").setExpanded(false);
            this._bShowCodeOnly = false;
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
        },

        /**
         *
         */
        _setItem: function (oItem) {
            this._suspendBindings();

            this._oModel.setProperty("/element/item", oItem);
            this._oModel.setProperty("/element/attributeFilter", []);
            this._oModel.setProperty("/element/assertFilter", []);

            this._adjustPreferredAccess(oItem);
            this._setValidAttributeTypes();
            this._adjustDefaultSettings(oItem).then(function () {
                this._updateValueState(oItem);
                this._updateSubActionTypes();
                this._updatePreview();
                this._validateSelectedItemNumber();

                this._resumeBindings();
            }.bind(this));
        },

        /**
         *
         */
        _adjustPreferredAccess: function (oItem) {
            this._adjustPreferredAccessItem(oItem);
            this._adjustPreferredAccessItem(oItem.parent);
            this._adjustPreferredAccessItem(oItem.parentL2);
            this._adjustPreferredAccessItem(oItem.parentL3);
            this._adjustPreferredAccessItem(oItem.parentL4);
            this._adjustPreferredAccessItem(oItem.label);
            this._adjustPreferredAccessItem(oItem.itemdata);
        },

        /**
         *
         */
        _adjustPreferredAccessItem: function (oItem) {
            if (!oItem) {
                return null;
            }
            var oMerged = this._getMergedClassArray(oItem);
            if (oMerged.defaultInteraction) {
                oItem.defaultInteraction = oMerged.defaultInteraction;
            }
            return oItem;
        },

        /**
         *
         */
        _setValidAttributeTypes: function () {
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
        },

        /**
         *
         */
        _adjustDefaultSettings: function (oItem) {
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
                    this._oModel.setProperty("/element/property/type", oMerged.preferredType);
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

                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                //replace everything, which is not so nice...
                sName = sName.replace(/[^0-9a-zA-Z_]/g, "");
                //check if the technical name is already given
                this._oModel.setProperty("/element/property/technicalName", sName);

                this._getMatchingElementCount().then(function (aReturn) {
                    if (this._oModel.getProperty("/element/property/selectItemBy") === "UI5" && aReturn.length > 1) {
                        this._oModel.setProperty("/element/property/selectItemBy", "ATTR"); // change to attribute in case that the ID is not sufficient..
                    }

                    this._adjustAttributeDefaultSetting(oItem).then(function () {
                        // adjust DOM node for action type "INP"..
                        this._adjustDomChildWith(oItem);
                        resolve();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },

        /**
         *
         */
        _findBestAttributeDefaultSetting: function (oItem, bForcePopup) {
            return new Promise(function (resolve) {
                //in case we still have >1 item - change to
                if (this._oModel.getProperty("/element/property/selectItemBy") === "ATTR" &&
                    ((this._oModel.getProperty("/element/identifiedElements").length > 1 && this._oModel.getProperty("/element/property/type") === 'ACT') || bForcePopup === true)) {

                    var aList = [];

                    // add information on binding context and path
                    if (!jQuery.isEmptyObject(oItem.binding)) {
                        for (var sAttr in oItem.binding) {
                            if (typeof oItem.binding[sAttr].path !== "object") {
                                var sModel = oItem.binding[sAttr].model === "undefined" || oItem.binding[sAttr].model === undefined ? "" : oItem.binding[sAttr].model + ">"
                                aList.push({
                                    type: "BNDG",
                                    typeTxt: "Binding path",
                                    bdgPath: sAttr,
                                    attribute: sAttr,
                                    importance: oItem.uniquness.binding[sAttr],
                                    value: sModel + oItem.binding[sAttr].path,
                                    valueToString: sModel + oItem.binding[sAttr].path
                                });
                            }
                        }
                    }

                    // add information on properties
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
        },

        /**
         *
         */
        _adjustDomChildWith: function (oItem) {
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
        },

        /**
         *
         */
        _adjustAttributeDefaultSetting: function (oItem) {
            return new Promise(function (resolve, reject) {
                var sProp = this._oModel.getProperty("/element/property/selectItemBy");
                if (sProp != "ATTR") {
                    this._oModel.setProperty("/element/attributeFilter", []);
                    resolve(this._getMatchingElementCount());
                } else {
                    resolve(this._findAttribute(oItem)); //generate standard, or "best fitting" (whatever that is :-)
                }
            }.bind(this));
        },

        /**
         *
         */
        _updateValueState: function (oItem) {
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
        },

        /**
         *
         */
        _findAttribute: function (oItem) {
            return new Promise(function (resolve, reject) {
                this._oModel.setProperty("/element/attributeFilter", []);

                var bSufficientForStop = false;
                // 1) we will ALWAYS add the property for metadata (class), as that just makes everything so much faster and safer
                this._add("/element/attributeFilter");

                // 2) add our LOCAL ID in case the local ID is okay
                if (oItem.identifier.ui5LocalId && oItem.identifier.localIdClonedOrGenerated === false) {
                    this._add("/element/attributeFilter", {
                        attributeType: "OWN",
                        criteriaType: "ID",
                        subCriteriaType: "LID"
                    });
                    bSufficientForStop = true;
                }

                var aReturn = this._oModel.getProperty("/element/identifiedElements");
                if (aReturn.length === 1 && bSufficientForStop === true) { // early exit if possible: the less attributes the better
                    resolve();
                    return;
                }

                // 3) we add the parent or the parent of the parent id in case the ID is unique..
                if (oItem.parent.identifier.ui5Id.length && oItem.parent.identifier.idGenerated === false && oItem.parent.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", {
                        attributeType: "PRT",
                        criteriaType: "ID",
                        subCriteriaType: "ID"
                    });
                    bSufficientForStop = true;
                } else if (oItem.parentL2.identifier.ui5Id.length && oItem.parentL2.identifier.idGenerated === false && oItem.parentL2.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", {
                        attributeType: "PRT2",
                        criteriaType: "ID",
                        subCriteriaType: "ID"
                    });
                    bSufficientForStop = true;
                } else if (oItem.parentL3.identifier.ui5Id.length && oItem.parentL3.identifier.idGenerated === false && oItem.parentL3.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", {
                        attributeType: "PRT3",
                        criteriaType: "ID",
                        subCriteriaType: "ID"
                    });
                    bSufficientForStop = true;
                } else if (oItem.parentL4.identifier.ui5Id.length && oItem.parentL4.identifier.idGenerated === false && oItem.parentL4.identifier.idCloned === false) {
                    this._add("/element/attributeFilter", {
                        attributeType: "PRT4",
                        criteriaType: "ID",
                        subCriteriaType: "ID"
                    });
                    bSufficientForStop = true;
                }

                var oMerged = this._getMergedClassArray(oItem);
                if (oMerged.cloned === true) {
                    bSufficientForStop = false;
                }

                // 4) now let's go for element-specific attributes
                if (oMerged.defaultAttributes && oMerged.defaultAttributes.length > 0) {
                    //add the elements from default attributes and stop.
                    for (var i = 0; i < oMerged.defaultAttributes.length; i++) {
                        this._add("/element/attributeFilter", oMerged.defaultAttributes[i]);
                    }
                }

                // 5) retry and get the elements from the page again
                this._getMatchingElementCount().then(function (aReturn) {

                    if (aReturn.length === 1) { // early exit if possible: the less attributes the better
                        resolve(aReturn);
                    }

                    // 6) now add the label text if possible and static
                    if (oItem.label &&
                        oItem.label.binding && oItem.label.binding.text && oItem.label.binding.text.static === true) {
                        this._add("/element/attributeFilter", {
                            attributeType: "PLBL",
                            criteriaType: "BNDG",
                            subCriteriaType: "text"
                        });
                    }

                    // 7) finally, resolve
                    resolve(aReturn);
                }.bind(this));
            }.bind(this));
        },

        /**
         *
         */
        _add: function (sPath, oTemplate) {
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
        },

        /**
         *
         */
        _remove: function (aContext) {
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
            this._validateSelectedItemNumber();
            this._check();
        },


        /**
         *
         */
        _updateAttributeTypes: function (oCtx) {
            var oAttribute = this._oModel.getProperty(oCtx.getPath());
            var oAttributeSettings = this._attributeTypes[oAttribute.attributeType];
            oAttribute.criteriaTypes = oAttributeSettings.criteriaTypes;

            //check if the current criteraType value is valid - if yes, keep it, otherwise reset it..
            if (oAttribute.criteriaTypes.filter(function (e) {
                    return e.criteriaKey === oAttribute.criteriaType;
                }).length === 0) {
                oAttribute.criteriaType = oAttribute.criteriaTypes[0].criteriaKey;
            }

            this._oModel.setProperty(oCtx.getPath(), oAttribute);

            this._updateCriteriaType(oCtx);
        },

        /**
         *
         */
        _updateCriteriaType: function (oCtx) {
            var oAttribute = this._oModel.getProperty(oCtx.getPath());
            var oItem = this._attributeTypes[oAttribute.attributeType].getItem(this._oModel.getProperty("/element/item"));
            if (oItem === null) {
                return;
            }
            var aSubCriteriaSettings = this._criteriaTypes[oAttribute.criteriaType].criteriaSpec(oItem);

            oAttribute.subCriteriaTypes = aSubCriteriaSettings;
            if (oAttribute.subCriteriaTypes.length > 0) {
                if (oAttribute.subCriteriaTypes.filter(function (e) {
                        return e.subCriteriaType === oAttribute.subCriteriaType;
                    }).length === 0) {
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
            //reset the criteriaValue because it can be false
            oAttribute.criteriaValue = "";

            this._oModel.setProperty(oCtx.getPath(), oAttribute);

            this._updateSubCriteriaType(oCtx);
        },

        /**
         *
         */
        _updateSubCriteriaType: function (oCtx) {
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
        },

        //#endregion


        // #region Preview update

        /**
         *
         */
        _updatePreview: function () {
            var oItem = this._oModel.getProperty("/element");
            this._suspendBindings();
            return this._adjustBeforeSaving(oItem).then(function (oElementFinal) {
                var codeSettings = this.getModel('viewModel').getProperty('/codeSettings');
                codeSettings.language = this.getModel('settings').getProperty('/settings/defaultLanguage');
                codeSettings.execComponent = this.getOwnerComponent();
                this.getModel("viewModel").setProperty("/code", CodeHelper.getItemCode(codeSettings, oElementFinal, this.getOwnerComponent()).join("\n").trim());
                this._resumeBindings();
            }.bind(this));
        },

        /**
         *
         */
        _validateSelectedItemNumber: function () {
            return this._getMatchingElementCount().then(function (aElements) {
                if (aElements.length !== 1) {
                    // expand elements panel when in ACTION mode: the user has to do sth. as only one element can be selected for an action
                    if (this._oModel.getProperty("/element/property/type") === 'ACT') {
                        this.byId("atrElementsPnl").setExpanded(true);
                    }
                }

                this._checkElementNumber();
                return aElements;
            }.bind(this));
        },

        // #endregion

        // #region Element identification and finding

        /**
         *
         */
        _getFoundElements: function () {
            var oDefinition = this._getSelectorDefinition(this._oModel.getProperty("/element"));

            return ConnectionMessages.findElements(Connection.getInstance(), oDefinition.selectorAttributes).then(function (aElements) {
                this._oModel.setProperty("/element/identifiedElements", aElements);
                return aElements;
            }.bind(this));
        },

        /**
         *
         */
        _getMatchingElementCount: function () {
            var oDefinition = this._getSelectorDefinition(this._oModel.getProperty("/element"));
            return ConnectionMessages.findElementIDsBySelector(Connection.getInstance(), oDefinition.selectorAttributes).then(function (aElements) {
                this._oModel.setProperty("/element/identifiedElements", aElements);
                return aElements;
            }.bind(this));
        },

        /**
         *
         */
        _getSelectorDefinition: function (oElement) {
            var oScope = {};
            var sSelector = "";
            var sSelectorAttributes = "";
            var sSelectorAttributesStringified = null;
            var sSelectorAttributesBtf = "";
            var oItem = oElement.item;
            var sSelectType = oElement.property.selectItemBy; //DOM | UI5 | ATTR
            var sSelectorExtension = oElement.property.domChildWith;
            var oSelectorUI5 = {};

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
                    var oSpec = Utils.getValueSpec(oAttribute, oItemLocal);
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
                sSelectorAttributesStringified = Utils.getSelectorToJSONString(oScope); //JSON.stringify(oScope);
                sSelectorAttributesBtf = JSON.stringify(oScope, null, 2);
            }

            return {
                selectorAttributes: sSelectorAttributes,
                selectorAttributesStringified: sSelectorAttributesStringified ? sSelectorAttributesStringified : sSelectorAttributes,
                selectorAttributesBtf: sSelectorAttributesBtf,
                selector: sSelector,
                selectorUI5: oSelectorUI5
            };
        },

        /**
         *
         */
        _convertValueSpecToUI5: function (oSpec, oSelectorUI5, oAttribute, oItem) {
            var oScopeLocal = this._attributeTypes[oAttribute.attributeType].getScope(oSelectorUI5);
            if (oAttribute.attributeType === "OWN") {
                oSelectorUI5.own = typeof oSelectorUI5.own !== "undefined" ? oSelectorUI5.own : {};
                oScopeLocal = oSelectorUI5.own;
            }
            oSpec.getUi5Spec(oScopeLocal, oItem);
        },


        // #endregion

        // #region Test-element checking

        /**
         * @returns {string} ok: false/true and message
         */
        _check: function () {
            return new Promise(function (resolve, reject) {
                this._getAttributeRating().then(function (oReturn) {
                    resolve({
                        rating: oReturn.rating,
                        message: oReturn.messages.length ? oReturn.messages[0].description : "",
                        messages: oReturn.messages
                    });
                });
            }.bind(this));
        },

        /**
         *
         */
        _checkElementNumber: function () {
            this._check().then(function (oCheck) {
                if (oCheck.rating === 5) {
                    this._oModel.setProperty("/element/property/elementState", "Success");
                } else if (oCheck.rating >= 2) {
                    this._oModel.setProperty("/element/property/elementState", "Warning");
                } else {
                    this._oModel.setProperty("/element/property/elementState", "Error");
                }
            }.bind(this));
        },

        /**
         * check if the data entered seems to be valid.. following checks are performed
         * (1) ID is used and generated
         * (2) ID is used and cloned
         * (3) DOM-ID is used (should be avoided where possible)
         * (4) No or >1 Element is selected..
         */
        _checkAndDisplay: function () {
            return new Promise(function (resolve, reject) {
                this._check().then(function (oResult) {
                    if (oResult.rating !== 5) {
                        MessageBox.show(oResult.message, {
                            styleClass: "sapUiCompact",
                            icon: MessageBox.Icon.WARNING,
                            title: "There are open issues - Are you sure you want to save?",
                            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                            /**
                             *
                             * @param {*} oAction
                             */
                            onClose: function (oAction) {
                                if (oAction === MessageBox.Action.OK) {
                                    resolve();
                                } else {
                                    reject();
                                }
                            }
                        });
                    } else {
                        resolve();
                    }
                });
            }.bind(this));
        },

        /**
         *
         */
        _getAttributeRating: function () {
            return new Promise(function (resolve, reject) {

                // indicate that the rating may take some time
                this.getView().setBusy(true);

                // prepare result values
                var iGrade = 5; // overall star rating
                var aMessages = []; // structure for obtained messages while rating

                // obtain temporary data used while rating
                var oElement = this._oModel.getProperty("/element");
                var oItem = this._oModel.getProperty("/element/item");
                var sSelectType = oElement.property.selectItemBy; //DOM | UI5 | ATTR

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

                //check the attributes.. for attributes we are at least expecting ONE element with a static id..
                if (sSelectType === "ATTR") {
                    var aAttributes = this._oModel.getProperty("/element/attributeFilter");

                    // check whether an ID-based selector is defined
                    var bIDFound = false;
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].subCriteriaType === "LID" || aAttributes[i].subCriteriaType === "ID") {
                            bIDFound = true;
                            break;
                        }
                    }
                    if (!bIDFound) {
                        iGrade = iGrade - 1;
                        aMessages.push({
                            type: "Warning",
                            title: "No ID in properties",
                            subtitle: "At least, one identifier is strongly recommended",
                            description: "In the selection attributes, there is no identifier configured. Please provide an identifier – at least, one at the parent levels, which is likely static."
                        });
                    }

                    // check if the corresponding ID is generic. if yes, we also have an issue
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].subCriteriaType === "LID" || aAttributes[i].subCriteriaType === "ID") {

                            var oSubScope = this._attributeTypes[aAttributes[i].attributeType].getScope(oItem);
                            if (oSubScope.metadata && (oSubScope.metadata.idCloned === true || oSubScope.metadata.idGenerated === true)) {
                                iGrade = iGrade - 2;
                                aMessages.push({
                                    type: "Warning",
                                    title: "Generic or cloned ID",
                                    subtitle: "Generic or cloned ID used in the test",
                                    description: "One of the attributes is using a generic or cloned identifier. This may affect your test."
                                });

                                break;
                            }
                        }
                    }

                    // check whether a binding context is used
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].criteriaType === "BNDG") {
                            aMessages.push({
                                type: "Information",
                                title: "Binding context",
                                subtitle: "Is the binding context static?",
                                description: "When using a binding context, please ensure that the inherit value is either static or predefined by your test."
                            });

                            break;
                        }
                    }

                    // check whether a text-based criterion is used
                    for (var i = 0; i < aAttributes.length; i++) {
                        if (aAttributes[i].criteriaType === "ATTR") {
                            if (aAttributes[i].subCriteriaType === "title" || aAttributes[i].subCriteriaType === "text") {
                                iGrade = iGrade - 1;
                                aMessages.push({
                                    type: "Warning",
                                    title: "Text attribute",
                                    subtitle: "Is the attribute static?",
                                    description: "You are binding against a text/title property. Are you sure that this text is not language-specific and does not change depending on the selected language? Consider using the binding path for i18n texts instead."
                                });

                                break;
                            }
                        }
                    }
                }

                var oRatingPromise;
                switch (oElement.property.type) { // ACT | ASS | SUP
                    case "ACT":
                        // check action
                        oRatingPromise = ConnectionMessages.checkAction(
                            Connection.getInstance(),
                            this._getSelectorDefinition(oElement).selectorAttributes
                        );
                        break;
                    case "ASS":
                        // execute assert
                        oRatingPromise = ConnectionMessages.executeAssert(Connection.getInstance(), {
                            element: this._getSelectorDefinition(oElement).selectorAttributes,
                            assert: Utils.getAssertDefinition(oElement),
                        });
                        break;
                    case "SUP":
                        // inspect support-assistant results that already exist
                        var aIssues = this._oModel.getProperty("/element/supportAssistantResult");
                        oRatingPromise = new Promise(function (resolve) {
                            resolve(aIssues);
                        });
                        break;
                }

                oRatingPromise.then(function (oResult) {

                    // set grade dependening on results
                    if (oResult.result === "error") {
                        iGrade = 1;
                    } else if (oResult.result === "warning") {
                        iGrade = 3;
                    }

                    // if there is an invalid grade, correct this
                    if (iGrade < 0) {
                        iGrade = 0;
                    }

                    // add messages to output
                    Array.prototype.push.apply(aMessages, oResult.messages);

                    // store messages and grade
                    this._oModel.setProperty("/element/messages", aMessages);
                    this._oModel.setProperty("/element/ratingOfAttributes", iGrade);

                    // unlock view
                    this.getView().setBusy(false);

                    resolve({
                        rating: iGrade,
                        messages: aMessages
                    });

                }.bind(this));

            }.bind(this));
        },

        // #endregion

        // #region Saving

        /**
         *
         * @param {*} fnCallback
         */
        _save: function () {
            return new Promise(function (resolve, reject) {
                this._checkAndDisplay().then(function () {
                        var oCurrentElement = this._oModel.getProperty("/element");
                        this._adjustBeforeSaving(oCurrentElement).then(function (oElementFinal) {

                            var aElements = RecordController.getInstance().getTestElements();
                            if (RecordController.getInstance().isReplaying()) {
                                aElements[this._sElementId] = oElementFinal;
                            } else {
                                aElements.push(oElementFinal);
                            }
                            RecordController.getInstance().setTestElements(aElements);

                            // execute test step now, but only if an action needs to be performed.
                            // all other types do not need results (asserts and support assistant).
                            if (oElementFinal.property.type === "ACT") {
                                RecordController.getInstance().executeTestStep(oElementFinal).then(resolve);
                            } else {
                                resolve();
                            }
                        }.bind(this));
                    }.bind(this))
                    .catch(function () {
                        reject();
                    });
            }.bind(this));
        },

        /**
         *
         * @param {*} oElement
         */
        _adjustBeforeSaving: function (oElement) {
            //what we are actually saving, is an extremly reduced form, of everything we need for code generation
            var oReturn = {
                property: oElement.property,
                item: oElement.item,
                attributeFilter: oElement.attributeFilter,
                assertFilter: oElement.assertFilter,
                subActionTypes: oElement.subActionTypes,
                selector: this._getSelectorDefinition(oElement),
                assertion: Utils.getAssertDefinition(oElement),
                href: "",
                hash: "",
                stepExecuted: true
            };

            var bRecording = RecordController.getInstance().isRecording();

            //adjust the technical name if duplicates..
            var aProp = RecordController.getInstance().getTestElements();
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

            if (bRecording) {
                return ConnectionMessages.getWindowInfo(Connection.getInstance()).then(function (oData) {
                    oReturn.href = oData.url;
                    oReturn.hash = oData.hash;
                    return JSON.parse(JSON.stringify(oReturn));
                });
            } else {
                oReturn.href = oElement.href;
                oReturn.hash = oElement.hash;
                return Promise.resolve(JSON.parse(JSON.stringify(oReturn)));
            }
        },

        // #endregion

        // #region Actions and asserts
        // TODO try to remove this region (move to RecordController or Utils)

        /**
         *
         */
        _updateSubActionTypes: function () {
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
                // eslint-disable-next-line no-loop-func
                if (aRows.filter(function (e) {
                        return e.domChildWith === sIdChild;
                    }).length === 0) {
                    aRows.push({
                        text: aSubObjects[i].isInput === true ? "In Input-Field" : sIdChild,
                        domChildWith: sIdChild,
                        order: 9999
                    });
                }
            }
            aRows = aRows.sort(function (a, b) {
                if (a.order > b.order) {
                    return 1;
                } else {
                    return -1;
                }
            });

            //check if the current value is fine..
            if (aRows.filter(function (e) {
                    return e.domChildWith === sDomChildWith;
                }).length === 0) {
                sDomChildWith = aRows.length >= 0 ? aRows[0].domChildWith : "";
                this._oModel.setProperty("/element/property/domChildWith", sDomChildWith);
            }
            //we now have a valid value - check if there is any preferred value for the currently selected
            this._oModel.setProperty("/element/subActionTypes", aRows);
        },

        // #endregion

        // #region Support assistant

        /**
         *
         */
        _runSupportAssistant: function () {
            ConnectionMessages.runSupportAssistant(Connection.getInstance(), {
                component: this._oModel.getProperty("/element/item/metadata/componentName"),
                rules: this._oModel.getProperty("/element/property/supportAssistant")
            }).then(function (oStoreResult) {
                Promise.all([
                    this._updatePreview(),
                    this._validateSelectedItemNumber()
                ]);
                this._oModel.setProperty("/statics/supportRules", oStoreResult.rules);
                this._oModel.setProperty("/element/supportAssistantResult", oStoreResult);
                this.byId("pnlSupAssistantRule").setBusy(false);
            }.bind(this));

            this.byId("pnlSupAssistantRule").setBusy(true);
        },

        // #endregion


        // #region Miscellaneous

        /**
         *
         */
        _initMessagePopovers: function () {
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
                    new sap.m.ObjectIdentifier({
                        title: '{viewModel>typeTxt}'
                    }),
                    new sap.m.ObjectIdentifier({
                        title: '{viewModel>attribute}'
                    }),
                    new sap.m.Text({
                        text: '{viewModel>valueToString}'
                    }),
                    new sap.m.ObjectNumber({
                        visible: '{viewModel>/element/itemCloned}',
                        number: '{viewModel>importance}',
                        state: '{viewModel>numberState}',
                        unit: '%'
                    })
                ]
            });
            this._oTableContext = new sap.m.Table({
                mode: "MultiSelect",
                /**
                 *
                 * @param {*} oEvent
                 */
                itemPress: function (oEvent) {
                    if (oEvent.getSource().setSelected) {
                        oEvent.getSource().setSelected(oEvent.getSource().getSelected() === false);
                    } else {
                        oEvent.getParameter("listItem").setSelected(oEvent.getParameter("listItem").getSelected() === false);
                    }
                },
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text: "Type"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text: "Name"
                        })
                    }),
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text: "Value"
                        })
                    }),
                    new sap.m.Column({
                        visible: '{viewModel>/element/itemCloned}',
                        header: new sap.m.Text({
                            text: "Expected Quality"
                        })
                    })
                ],
                items: {
                    path: 'viewModel>/element/possibleContext',
                    template: oTemplateCtx
                }
            });

            this._oSelectDialog = new sap.m.Dialog({
                contentHeight: "75%",
                id: "tstDialog",
                title: "Please specify a unique combination",
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
                                                })
                                            ]
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
                                this._add("/element/attributeFilter", {
                                    attributeType: "OWN",
                                    criteriaType: oBndgCtxObj.type,
                                    subCriteriaType: oBndgCtxObj.bdgPath
                                });
                            }
                            Promise.all([
                                this._updatePreview(),
                                this._validateSelectedItemNumber()
                            ]);
                        }
                        this._oSelectDialog.close();
                    }.bind(this)
                })
            });

            this._oSelectDialog.addStyleClass("sapUiSizeCompact");
        },

        /**
         *
         */
        _suspendBindings: function () {
            this.byId("idAttributeTable").getBinding("items").suspend();
            this.byId("idAssertionTable").getBinding("items").suspend();
            this.byId("tblIdentifiedElements").getBinding("items").suspend();
        },

        /**
         *
         */
        _resumeBindings: function () {
            this.byId("idAttributeTable").getBinding("items").resume();
            this.byId("idAssertionTable").getBinding("items").resume();
            this.byId("tblIdentifiedElements").getBinding("items").resume();
            this.byId("attrObjectStatus").getBinding("text").refresh(true);
        },

        /**
         *
         */
        _getMergedClassArray: function (oItem) {
            var aClassArray = this._getClassArray(oItem);
            var oReturn = {
                defaultAction: {
                    "": ""
                },
                preferredType: "ACT",
                askForBindingContext: false,
                preferredProperties: [],
                defaultInteraction: null,
                defaultBlur: false,
                defaultEnter: false,
                cloned: false,
                defaultAttributes: [],
                actions: {}
            };
            //merge from button to top (while higher elements are overwriting lower elements)
            for (var i = 0; i < aClassArray.length; i++) {
                var oClass = aClassArray[i];
                oReturn.actions = oReturn.actions ? oReturn.actions : [];
                if (!oClass.defaultAction) {
                    oClass.defaultAction = [];
                } else if (typeof oClass.defaultAction === "string") {
                    oClass.defaultAction = [{
                        domChildWith: "",
                        action: oClass.defaultAction
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
                            var aExisting = oReturn.actions[sAction].filter(function (e) {
                                return e.domChildWith === oClass.actions[sAction][j].domChildWith;
                            });
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
        },

        /**
         *
         */
        _getClassArray: function (oItem) {
            var oMetadata = oItem.classArray;
            var aReturn = [];
            for (var i = 0; i < oItem.classArray.length; i++) {
                var sClassName = oItem.classArray[i].elementName;
                if (this._oElementMix[sClassName]) {
                    aReturn.unshift(this._oElementMix[sClassName]);
                }
            }
            return $.extend(true, [], aReturn);
        },

        // #endregion

    });






});
