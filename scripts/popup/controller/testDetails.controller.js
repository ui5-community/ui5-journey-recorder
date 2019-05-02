sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    "com/ui5/testing/model/Navigation",
    "com/ui5/testing/model/Communication",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/GlobalSettings",
    "com/ui5/testing/model/CodeHelper",
    "com/ui5/testing/model/ChromeStorage",
    "com/ui5/testing/model/Utils",
    "sap/m/MessageToast",
    "com/ui5/testing/libs/jszip.min",
    "com/ui5/testing/libs/FileSaver.min"
], function (Controller,
             JSONModel,
             MessagePopover,
             MessageItem,
             Navigation,
             Communication,
             RecordController,
             GlobalSettings,
             CodeHelper,
             ChromeStorage,
             Utils,
             MessageToast) {
    "use strict";

    var TestDetails = Controller.extend("com.ui5.testing.controller.TestDetails", {
        _oModel: new JSONModel({
            codes: [],
            test: {},
            replayMode: false,
            codeSettings: {
                language: "UI5",
                testName: "",
                testCategory: "",
                testUrl: "",
                ui5Version: "",
                supportAssistant: false
            },
            dynamic: {
                attrType: []
            },
            statics: {
                supportRules: []
            },
            activeTab: 'settings'
        }),
        _bActive: false,
        _iGlobal: 0,
        _bStarted: false,
        _bReplayMode: false,

        onInit: function () {
            Communication.registerEvent("itemSelected", this._onItemSelected.bind(this));

            this.getView().setModel(this._oModel, "viewModel");
            this.getView().setModel(RecordController.getModel(), "recordModel");
            this.getView().setModel(Navigation.getModel(), "navModel");
            this._createDialog();
            this.getOwnerComponent().getRouter().getRoute("testDetails").attachPatternMatched(this._onTestDisplay, this);
            this.getOwnerComponent().getRouter().getRoute("testDetailsCreate").attachPatternMatched(this._onTestCreate, this);
            this.getOwnerComponent().getRouter().getRoute("testDetailsCreateQuick").attachPatternMatched(this._onTestCreateQuick, this);
            this.getOwnerComponent().getRouter().getRoute("testReplay").attachPatternMatched(this._onTestReplay, this);
            Communication.registerEvent("loaded", this._onInjectionDone.bind(this));

            //Why is this function subscribed?
            //sap.ui.getCore().getEventBus().subscribe("RecordController", "windowFocusLost", this._recordStopped, this);
        },
    });

    TestDetails.prototype._onInjectionDone = function (oData) {
        if (oData.ok === true) {
            this._oModel.setProperty('/ui5Version', oData.version);
        }
    };

    TestDetails.prototype._replay = function () {
        var sUrl = this._oModel.getProperty("/codeSettings/testUrl");
        chrome.tabs.create({
            url: sUrl,
            active: false
        }, function (tab) {
            var sCheckUrl = sUrl;
            const fnListenerFunction = function (tabId, changeInfo, tab) {
                if (tab.url.indexOf(sCheckUrl) > -1 && changeInfo.status === 'complete') {
                    chrome.windows.create({
                        tabId: tab.id,
                        type: 'normal',
                        focused: true,
                        state: 'maximized'
                    }, function (fnWindow) {
                        //now inject into our window..
                        RecordController.injectScript(tab.id).then(function (oData) {
                            if (!RecordController.isInjected()) {
                                this._bReplayMode = true;
                                this.getView().byId('tblPerformedSteps').getItems().forEach(function (oStep) {
                                    oStep.setHighlight(sap.ui.core.MessageType.None);
                                });
                                this._startReplay();
                            }
                            if (oData) {
                                this._oModel.setProperty('/ui5Version', oData.version);
                            }
                        }.bind(this));

                        const fnListenHandshake = function (message, sender, sendResponse) {
                            if (message.type === "HandshakeToWindow") {
                                chrome.runtime.sendMessage({
                                    "type": "send-window-id",
                                }, function (response) {
                                });
                                chrome.runtime.onMessage.removeListener(fnListenerFunction());
                            }
                        };

                        chrome.runtime.onMessage.addListener(fnListenHandshake());
                    }.bind(this));
                    chrome.tabs.onUpdated.removeListener(fnListenerFunction);
                }
            };
            chrome.tabs.onUpdated.addListener(fnListenerFunction.bind(this));
        }.bind(this));
    };

    TestDetails.prototype._startReplay = function () {
        this._iCurrentStep = 0;
        this._updatePlayButton();
    };

    TestDetails.prototype.onReplaySingleStep = function (oEvent) {
        var oLine = oEvent.getSource().getParent();
        RecordController.focusTargetWindow();
        this._executeAction().then(function (oResult) {
            var performedStep = oLine;
            //this is our custom object
            if (oResult.type && oResult.type === "ASS") {
                switch (oResult.result) {
                    case "success":
                        performedStep.setHighlight(sap.ui.core.MessageType.Success);
                        this.replayNextStep();
                        break;
                    case "warning":
                        performedStep.setHighlight(sap.ui.core.MessageType.Warning);
                        this.replayNextStep();
                        break;
                    case "error":
                        this.getModel("viewModel").setProperty("/replayMode", false);
                        MessageToast.show('Assertion not met, check your setup!');
                        performedStep.setHighlight(sap.ui.core.MessageType.Error);
                        break;
                    default:
                        jQuery.sap.log.info(`No handling for no event`);
                }
                //This is the object back from the Communication object.
            } else if (oResult.uuid) {
                if (oResult.processed) {
                    performedStep.setHighlight(sap.ui.core.MessageType.Success);
                    this.replayNextStep();
                } else {
                    this.getModel("viewModel").setProperty("/replayMode", false);
                    MessageToast.show('Action can not be performed, check your setup!');
                    performedStep.setHighlight(sap.ui.core.MessageType.Error);
                }
            } else if (oResult.type && oResult.type === "ACT" && oResult.result === "error") {
                this.getModel("viewModel").setProperty("/replayMode", false);
                MessageToast.show('Action can not be performed, check your setup!');
                performedStep.setHighlight(sap.ui.core.MessageType.Error);
            }
        }.bind(this));
    };

    TestDetails.prototype._executeAction = function () {
        var aEvent = this.getModel("navModel").getProperty("/elements");
        var oElement = aEvent[this._iCurrentStep];

        return new Promise(function (resolve) {
            if (oElement.property.type === "ACT") {
                this._getFoundElements(oElement).then(function (aElements) {
                    if (aElements.length === 0) {
                        resolve({result: "error", type: "ACT"});
                        return;
                    }
                    oElement.item.identifier = aElements[0].identifier;
                    Communication.fireEvent("execute", {
                        element: oElement
                    }).then(resolve);
                });
            } else if (oElement.property.type === "ASS") {
                this._getFoundElements(oElement).then(function (aElements) {
                    if (aElements.length === 1) {
                        resolve({result: "success", type: "ASS"});
                    } else if (aElements.length > 1) {
                        resolve({result: "warning", type: "ASS"});
                    } else {
                        resolve({result: "error", type: "ASS"});
                    }
                });
            } else {
                resolve();
                return false;
            }
        }.bind(this));
    };

    TestDetails.prototype._getFoundElements = function (oElement) {
        var oDefinition = oElement.selector;

        return new Promise(function (resolve, reject) {
            this._findItemAndExclude(oDefinition.selectorAttributes).then(function (aItemsEnhanced) {
                //make an assert check..
                resolve(aItemsEnhanced);
            }.bind(this));
        }.bind(this));
    };

    TestDetails.prototype._findItemAndExclude = function (oSelector) {
        return Communication.fireEvent("find", oSelector);
    }

    TestDetails.prototype.replayNextStep = function () {
        var aEvent = this.getModel("navModel").getProperty("/elements");
        this._iCurrentStep += 1;
        this._updatePlayButton();
        if (this._iCurrentStep >= aEvent.length) {
            this._bReplayMode = false;
            this.getModel("viewModel").setProperty("/replayMode", false);
            RecordController.startRecording();
            this.getRouter().navTo("testDetails", {
                TestId: this.getModel("navModel").getProperty("/test/uuid")
            });
        }
    };

    TestDetails.prototype._updatePlayButton = function () {
        if (!this._oModel.getProperty("/replayMode")) {
            this._oModel.setProperty("/replayMode", true);
        }
        var aElement = this.getModel("navModel").getProperty("/elements");
        for (var i = 0; i < aElement.length; i++) {
            aElement[i].showPlay = i === this._iCurrentStep;
        }
        this.getModel("navModel").setProperty("/elements", aElement);
    };

    TestDetails.prototype.uuidv4 = function () {
        var sStr = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }) + this._iGlobal;
        this._iGlobal = this._iGlobal + 1;
        return sStr;
    };

    TestDetails.prototype._createDialog = function () {
        this._oRecordDialog = sap.ui.xmlfragment(
            "com.ui5.testing.fragment.RecordDialog",
            this
        );
        this._oRecordDialog.setModel(this._oModel, "viewModel");
        this._oRecordDialog.setModel(RecordController.getModel(), "recordModel");
    };

    TestDetails.prototype.onRecord = function () {
        RecordController.startRecording();
    };

    TestDetails.prototype.onSave = function () {
        //save /codesettings & /test & navModel>/elements - optimiazion potential..
        var oSave = {
            codeSettings: this._oModel.getProperty("/codeSettings"),
            elements: this.getModel("navModel").getProperty("/elements"),
            test: this.getModel("navModel").getProperty("/test")
        };
        ChromeStorage.saveRecord(oSave);
    };

    TestDetails.prototype.onDelete = function () {
        var sId = this.getModel("navModel").getProperty("/test/uuid");
        ChromeStorage.deleteTest(sId).then(this.getRouter().navTo("start"));
    };

    TestDetails.prototype.onNavBack = function () {
        RecordController.stopRecording();
        this._oRecordDialog.close();
        this.getRouter().navTo("start");
    };

    TestDetails.prototype.onStopRecord = function () {
        RecordController.stopRecording();
        this._oRecordDialog.close();
    };

    TestDetails.prototype._onTestCreateQuick = function (oEvent) {
        this._bQuickMode = true;
        this._initTestCreate(true);
    };

    TestDetails.prototype._onTestCreate = function (oEvent) {
        this._bQuickMode = false;
        this._initTestCreate(false);
    };

    TestDetails.prototype._initTestCreate = function (bImmediate) {
        this._oModel.setProperty("/replayMode", false);

        this.getModel("navModel").setProperty("/test", {
            uuid: this.uuidv4(),
            createdAt: new Date().getTime()
        });
        this._oModel.setProperty("/codeSettings/language", this.getModel("settings").getProperty("/settings/defaultLanguage"));
        this._oModel.setProperty("/codeSettings/authentification", this.getModel("settings").getProperty("/settings/defaultAuthentification"));
        Communication.fireEvent("getwindowinfo").then(function (oData) {
            if (!oData) {
                return;
            }
            this._oModel.setProperty("/codeSettings/testName", oData.title);
            this._oModel.setProperty("/codeSettings/testCategory", oData.title);
            this._oModel.setProperty("/codeSettings/testUrl", oData.url);
            RecordController.startRecording(bImmediate);
            if (bImmediate === true) {
                this._oRecordDialog.close();
            }

            this.getRouter().navTo("testDetails", {
                TestId: this.getModel("navModel").getProperty("/test/uuid")
            });
        }.bind(this));
    }

    TestDetails.prototype._onItemSelected = function (oData) {
        if (this._bReplayMode === true) {
            return; //NO!
        }

        Navigation.setSelectedItem(oData);
        RecordController.focusPopup();

        if (this._bQuickMode !== true) {
            this.getRouter().navTo("elementCreate", {
                TestId: this.getModel("navModel").getProperty("/test/uuid"),
                ElementId: oData.identifier.ui5AbsoluteId
            });
        } else {
            this.getRouter().navTo("elementCreateQuick", {
                TestId: this.getModel("navModel").getProperty("/test/uuid"),
                ElementId: oData.identifier.ui5AbsoluteId
            });
        }
    };

    TestDetails.prototype._onTestReplay = function (oEvent) {
        var sTargetUUID = oEvent.getParameter("arguments").TestId;
        var sCurrentUUID = this.getModel("navModel").getProperty("/test/uuid");
        if (sTargetUUID === this._oTestId && this._oModel.getProperty("/replayMode") === true) {
            if (this.getModel("navModel").getProperty("/elements/" + this._iCurrentStep + "/stepExecuted") === true) {
                this.replayNextStep();
            }
            return;
        }

        this._oTestId = sTargetUUID;
        this._iCurrentStep = 0;
        if (sCurrentUUID !== sTargetUUID) {
            //we have to read the current data..
            ChromeStorage.get({
                key: sTargetUUID,
                success: function (oSave) {
                    if (!oSave) {
                        this.getRouter().navTo("start");
                        return;
                    }
                    oSave = JSON.parse(oSave);
                    this._oModel.setProperty("/codeSettings", oSave.codeSettings);
                    this.getModel("navModel").setProperty("/elements", oSave.elements);
                    this.getModel("navModel").setProperty("/elementLength", oSave.elements.length);
                    this.getModel("navModel").setProperty("/test", oSave.test);
                    this._updatePreview();
                    this._updatePlayButton();
                    this._replay();
                }.bind(this)
            });
        } else {
            this._updatePreview();
            this._updatePlayButton();
            this._replay();
        }
    };

    TestDetails.prototype._onTestDisplay = function (oEvent) {
        this._oModel.setProperty("/replayMode", false);
        var sTargetUUID = oEvent.getParameter("arguments").TestId;
        var sCurrentUUID = this.getModel("navModel").getProperty("/test/uuid");
        if (sCurrentUUID !== sTargetUUID) {
            //we have to read the current data..
            ChromeStorage.get({
                key: sTargetUUID,
                success: function (oSave) {
                    if (!oSave) {
                        this.getRouter().navTo("start");
                        return;
                    }
                    oSave = JSON.parse(oSave);
                    this._oModel.setProperty("/codeSettings", oSave.codeSettings);
                    this.getModel("navModel").setProperty("/elements", oSave.elements);
                    this.getModel("navModel").setProperty("/elementLength", oSave.elements.length);
                    this.getModel("navModel").setProperty("/test", oSave.test);
                    this._updatePreview();
                }.bind(this)
            });
        } else if (this.getModel("recordModel").getProperty("/recording") === true && this._bQuickMode === false) {
            setTimeout(function () {
                this._oRecordDialog.open();
            }.bind(this), 100);
        }
        this._updatePreview();
    };

    TestDetails.prototype._updatePreview = function () {
        var aStoredItems = this.getModel("navModel").getProperty("/elements");
        var codeSettings = this.getModel('viewModel').getProperty('/codeSettings');
        codeSettings.language = this.getModel('settings').getProperty('/settings/defaultLanguage');
        codeSettings.execComponent = this.getOwnerComponent();
        this._oModel.setProperty("/codes", CodeHelper.getFullCode(codeSettings, aStoredItems));
    };

    TestDetails.prototype.onContinueRecording = function () {
        this._oRecordDialog.open();
        RecordController.startRecording();
    };

    TestDetails.prototype.onDeleteStep = function (oEvent) {
        var aItem = oEvent.getSource().getBindingContext("navModel").getPath().split("/");
        var sNumber = parseInt(aItem[aItem.length - 1], 10);
        var aElements = this.getModel("navModel").getProperty("/elements");
        aElements.splice(sNumber, 1);
        this.getModel("navModel").setProperty("/elements", aElements);
        this._updatePlayButton();
    };

    TestDetails.prototype.onReplayAll = function (oEvent) {
        var sUrl = this._oModel.getProperty("/codeSettings/testUrl");
        this.getView().byId('tblPerformedSteps').getItems().forEach(function (oStep) {
            oStep.setHighlight(sap.ui.core.MessageType.None);
        });
        chrome.permissions.request({
            permissions: ['tabs'],
            origins: [sUrl]
        }, function (granted) {
            if (granted) {
                this.getRouter().navTo("testReplay", {
                    TestId: this.getModel("navModel").getProperty("/test/uuid")
                });
            }
        }.bind(this));
    };

    TestDetails.prototype.onExport = function () {
        var oSave = {
            versionId: "0.2.0",
            codeSettings: this._oModel.getProperty("/codeSettings"),
            elements: this.getModel("navModel").getProperty("/elements"),
            test: this.getModel("navModel").getProperty("/test")
        };

        //fix for cycling object
        delete oSave.codeSettings.execComponent;

        var vLink = document.createElement('a'),
            vBlob = new Blob([JSON.stringify(oSave, null, 2)], {type: "octet/stream"}),
            vName = 'export.json',
            vUrl = window.URL.createObjectURL(vBlob);
        vLink.setAttribute('href', vUrl);
        vLink.setAttribute('download', vName);
        vLink.click();
    };

    TestDetails.prototype.onEditStep = function (oEvent) {
        //set the current step on not activate..
        var iNumber = oEvent.getSource().getBindingContext("navModel").getPath().split("/");
        this._iCurrentStep = parseInt(iNumber[iNumber.length - 1], 10);
        this.getModel("navModel").setProperty("/elements/" + this._iCurrentStep + "/stepExecuted", false);
        this.getRouter().navTo("elementDisplay", {
            TestId: this.getModel("navModel").getProperty("/test/uuid"),
            ElementId: this._iCurrentStep
        });
    };

    TestDetails.prototype.onExpandControl = function (oEvent) {
        var oPanel = oEvent.getSource().getParent();
        oPanel.setExpanded(oPanel.getExpanded() === false);
    };

    TestDetails.prototype.onUpdatePreview = function () {
        this._updatePreview();
    };

    TestDetails.prototype.showCode = function (sId) {
        this._bShowCodeOnly = true;
    };

    TestDetails.prototype._lengthStatusFormatter = function (iLength) {
        return "Success";
    };

    TestDetails.prototype.downloadSource = function (oEvent) {
        var sSourceCode = oEvent.getSource().getParent().getContent().filter(c => c instanceof sap.ui.codeeditor.CodeEditor)[0].getValue();
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/javascript;charset=utf-8,' + encodeURIComponent(sSourceCode));
        var fileName = Utils.replaceUnsupportedFileSigns(oEvent.getSource().getParent().getText(), '_') + '.js';
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
    };

    TestDetails.prototype.onTabChange = function (oEvent) {
        this._oModel.setProperty('/activeTab', oEvent.getSource().getSelectedKey());
    };

    TestDetails.prototype.downloadAll = function (oEvent) {
        var zip = new JSZip();
        //take all sources containing code no free text

        if (this._oModel.getProperty('/codeSettings/language') === "OPA") {
            var aSources = this.getView()
                .byId('codeTab')
                .getItems()
                .filter(f => f.getContent().filter(c => c instanceof sap.m.FormattedText)[0].getVisible() === false);
            var test = zip.folder('test');
            var integration = test.folder('integration');
            var customMatcher = test.folder('customMatcher');
            var pages = integration.folder('pages');

            //get all pages
            aSources.filter(t => t.getText().indexOf('Page') > -1)
                .map(t => ({
                    fileName: Utils.replaceUnsupportedFileSigns(t.getText(), '_') + '.js',
                    source: t.getContent().filter(c => c instanceof sap.ui.codeeditor.CodeEditor)[0].getValue()
                }))
                .forEach(c => pages.file(c.fileName, c.source));

            //get all matcher implementation
            aSources.filter(t => t.getText().indexOf('Matcher') > -1)
                .map(t => ({
                    fileName: Utils.replaceUnsupportedFileSigns(t.getText(), '_') + '.js',
                    source: t.getContent().filter(c => c instanceof sap.ui.codeeditor.CodeEditor)[0].getValue()
                }))
                .forEach(c => customMatcher.file(c.fileName, c.source));

            //get all remaining except pages and matcher
            aSources.filter(t => t.getText().indexOf('Matcher') === -1 && t.getText().indexOf('Page') === -1)
                .map(t => ({
                    fileName: Utils.replaceUnsupportedFileSigns(t.getText(), '_') + '.js',
                    source: t.getContent().filter(c => c instanceof sap.ui.codeeditor.CodeEditor)[0].getValue()
                }))
                .forEach(c => integration.file(c.fileName, c.source));
        } else {
            this.getView()
                .byId('codeTab')
                .getItems()
                .filter(f => f.getContent().filter(c => c instanceof sap.m.FormattedText)[0].getVisible() === false)
                .map(t => ({
                    fileName: Utils.replaceUnsupportedFileSigns(t.getText(), '_') + '.js',
                    source: t.getContent()
                        .filter(c => c instanceof sap.ui.codeeditor.CodeEditor)[0].getValue()
                }))
                .forEach(c => zip.file(c.fileName, c.source))
        }

        zip.generateAsync({
            type: "blob"
        })
            .then(content => saveAs(content, "testCode.zip"));
    };

    return TestDetails;
});