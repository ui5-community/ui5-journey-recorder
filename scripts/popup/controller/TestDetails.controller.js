sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/GlobalSettings",
    "com/ui5/testing/model/CodeHelper",
    "com/ui5/testing/model/ChromeStorage",
    "com/ui5/testing/model/Utils",
    "sap/m/MessageBox",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "com/ui5/testing/libs/jszip.min",
    "com/ui5/testing/libs/FileSaver.min"
], function (Controller,
    JSONModel,
    Fragment,
    Connection,
    ConnectionMessages,
    RecordController,
    GlobalSettings,
    CodeHelper,
    ChromeStorage,
    Utils,
    MessageBox,
    MessagePopover,
    MessageItem,
    Dialog,
    Button,
    Text) {
    "use strict";

    return Controller.extend("com.ui5.testing.controller.TestDetails", {
        utils: Utils,
        _oRecordDialog: null,
        _oMessagePopover: null,
        _oModel: new JSONModel({
            codes: [],
            test: {},
            replayMode: false,
            replayType: 0,
            replayMessages: [],
            routeName: "",
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

        /**
         *
         */
        onInit: function () {
            // set models
            this.getView().setModel(this._oModel, "viewModel");
            this.getView().setModel(RecordController.getInstance().getModel(), "recordModel");
            this.getView().setModel(GlobalSettings.getModel(), "settings");

            // due to the binding, the settings value gets overridden, so a retrieval of the default value for the replay type/timeout is needed
            this.getModel("settings").setProperty("/settings/defaultReplayType", this.getModel("settings").getProperty("/settingsDefault/defaultReplayType"));
            this.getModel("settings").setProperty("/settings/defaultReplayTimeout", this.getModel("settings").getProperty("/settingsDefault/defaultReplayTimeout"));

            // initialize recording dialog and reset replay messages
            this._createDialog();
            this._resetReplayMessages();

            // attach routes
            this.getOwnerComponent().getRouter().getRoute("TestDetails").attachPatternMatched(this._onTestDisplay, this);
            this.getOwnerComponent().getRouter().getRoute("TestDetailsCreate").attachPatternMatched(this._onTestCreate, this);
            this.getOwnerComponent().getRouter().getRoute("TestDetailsCreateQuick").attachPatternMatched(this._onTestCreateQuick, this);
            this.getOwnerComponent().getRouter().getRoute("testReplay").attachPatternMatched(this._onTestReplay, this);

            // add event listener for item selections on page
            sap.ui.getCore().getEventBus().subscribe("Internal", "itemSelected", this._onItemSelected.bind(this));
            sap.ui.getCore().getEventBus().subscribe("Internal", "replayMessages", this._onReceiveReplayMessages.bind(this));
            sap.ui.getCore().getEventBus().subscribe("Internal", "replayFinished", this._onCheckRecordContinuing.bind(this));

            // trigger prompt on unload!
            // TODO insert function here that asks for saving the changes → which can be used also on connection losses
            window.addEventListener('beforeunload', function (e) {
                // cancel the event
                e.preventDefault();
                // set 'returnValue' as required by Chrome
                e.returnValue = '';
            });
        },

        // #region Routes

        /**
         *
         */
        _onTestDisplay: function (oEvent) {
            this._oModel.setProperty("/routeName", oEvent.getParameter('name'));
            this.getView().byId('tblPerformedSteps').getItems().forEach(function (oStep) {
                oStep.setHighlight(sap.ui.core.MessageType.None);
            });
            this._oModel.setProperty("/replayMode", false);
            this._sTestId = oEvent.getParameter("arguments").TestId;
            var sTargetUUID = this._sTestId;
            var sCurrentUUID = RecordController.getInstance().getTestUUID();
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
                        RecordController.getInstance().setTestElements(oSave.elements);
                        RecordController.getInstance().setTestDetails(oSave.test);
                        this._updatePreview();
                    }.bind(this)
                });
            } else if (RecordController.getInstance().isRecording() && this._bQuickMode === false) {
                setTimeout(function () {
                    this._oRecordDialog.open();
                }.bind(this), 100);
            }
            this._updatePreview();
            this._resetReplayMessages();
        },

        /**
         *
         * @param {*} oEvent
         */
        _onTestCreate: function (oEvent) {
            this._oModel.setProperty("/routeName", oEvent.getParameter('name'));
            this.getView().byId('tblPerformedSteps').getItems().forEach(function (oStep) {
                oStep.setHighlight(sap.ui.core.MessageType.None);
            });
            this._bQuickMode = false;
            this._initTestCreate(false);
        },

        /**
         *
         * @param {*} oEvent
         */
        _onTestCreateQuick: function (oEvent) {
            this._oModel.setProperty("/routeName", oEvent.getParameter('name'));
            this.getView().byId('tblPerformedSteps').getItems().forEach(function (oStep) {
                oStep.setHighlight(sap.ui.core.MessageType.None);
            });
            this._bQuickMode = true;
            this._initTestCreate(true);
        },

        /**
         *
         * @param {*} oEvent
         */
        _onTestReplay: function (oEvent) {
            this._oModel.setProperty("/routeName", oEvent.getParameter('name'));
            this.getView().byId('tblPerformedSteps').getItems().forEach(function (oStep) {
                oStep.setHighlight(sap.ui.core.MessageType.None);
            });
            var sTargetUUID = oEvent.getParameter("arguments").TestId;
            var sCurrentUUID = RecordController.getInstance().getTestUUID();
            if (sTargetUUID === this._oTestId && this._oModel.getProperty("/replayMode")) {
                if (RecordController.getInstance().isTestStepExecuted(this._iCurrentStep)) {
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
                        RecordController.getInstance().setTestElements(oSave.elements);
                        RecordController.getInstance().setTestDetails(oSave.test);
                        this._updatePreview();
                        //this._updatePlayButton();
                        this._replay();
                    }.bind(this)
                });
            } else {
                this._updatePreview();
                //this._updatePlayButton();
                this._replay();
            }
        },

        // #endregion

        // #region Event handling regarding view

        /**
         *
         */
        onTabChange: function (oEvent) {
            this._oModel.setProperty('/activeTab', oEvent.getSource().getSelectedKey());
        },

        /**
         *
         */
        onUpdatePreview: function () {
            this._updatePreview();
        },

        /**
         *
         */
        onStepClick: function (oEvent) {
            var sPath = oEvent.getSource().getBindingContext('recordModel').getPath();
            sPath = sPath.substring(sPath.lastIndexOf('/') + 1);
            this.getRouter().navTo("elementDisplay", {
                TestId: this._sTestId,
                ElementId: sPath
            });
        },

        /**
         *
         */
        onDeleteStep: function (oEvent) {
            var sPath = oEvent.getSource().getBindingContext("recordModel").getPath();
            var sNumber = sPath.split("/").pop();
            RecordController.getInstance().removeTestElementById(sNumber);
            this._updatePlayButton();
        },

        /**
         *
         */
        onStopRecord: function () {
            RecordController.getInstance().stopRecording();
            this._oRecordDialog.close();
        },

        /**
         *
         */
        onReplayStart: function () {

            // store URL to test for easier access
            var sURL = this._oModel.getProperty("/codeSettings/testUrl");

            // construct a promise whether to start replaying right away:
            // resolve indicates replaying can start, reject otherwise
            var replayablePromise = new Promise(function(resolve, reject) {

                // make sure that no recording is going on now
                if (RecordController.getInstance().isRecording()) {

                    // ask user whether to stop recording in favor of replay
                    MessageBox.error(
                        "You are recording right now. Do you want start replaying instead?",
                        {
                            icon: MessageBox.Icon.QUESTION,
                            title: "Stop recording?",
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (sAction) {
                                if (sAction === MessageBox.Action.YES) {
                                    resolve(sURL);
                                } else {
                                    reject();
                                }
                            }
                        }
                    );

                } else
                // check whether there is a replay right now
                if (RecordController.getInstance().isReplaying()) {
                    reject("You are replaying already. Finish the current replay first before starting another one.");
                }
                // if no recording is going on, go to replaying right away
                else {
                    resolve(sURL);
                }

            });

            // what to do after resolving/rejecting replay-indication promise
            replayablePromise
            .then(function(sURL) {
                RecordController.getInstance().startReplaying(sURL);
                this._resetReplayMessages();
            }.bind(this))
            .catch(function(sMessage) {
                if (sMessage) {
                    MessageBox.error(sMessage, {
                        title: "Replay error"
                    });
                }
            });
        },


        /**
         *
         */
        onReplayStop: function () {
            RecordController.getInstance().stopReplaying();
        },

        /**
         *
         * @param {*} oEvent
         */
        onReplaySingleStep: function () {
            RecordController.getInstance().replayNextStep();
        },

        /**
         *
         */
        onContinueRecording: function () {
            this._oRecordDialog.open();
            RecordController.getInstance().startRecording();
        },

        /**
         *
         */
        onNavBack: function () {
            // stop recording
            RecordController.getInstance().stopRecording();
            this._oRecordDialog.close();
            // close automatically opened tab if we currently are in a replay
            if (this._oModel.getProperty("/replayMode")) {
                RecordController.getInstance().closeTab();
            }
            // go to start page
            this.getRouter().navTo("start");
        },

        /**
         *
         */
        onSave: function () {
            //save /codesettings & /test & /elements - optimiazion potential..
            var oSave = {
                codeSettings: this._oModel.getProperty("/codeSettings"),
                elements: RecordController.getInstance().getTestElements(),
                test: RecordController.getInstance().getTestDetails()
            };
            ChromeStorage.saveRecord(oSave);
        },

        /**
         *
         */
        onDelete: function () {
            var sId = RecordController.getInstance().getTestUUID();
            ChromeStorage.deleteTest(sId).then(this.getRouter().navTo("start"));
        },

        /**
         *
         */
        onExport: function () {
            var oSave = {
                versionId: "0.2.0",
                codeSettings: this._oModel.getProperty("/codeSettings"),
                elements: RecordController.getInstance().getTestElements(),
                test: RecordController.getInstance().getTestDetails()
            };

            //fix for cycling object
            delete oSave.codeSettings.execComponent;

            var vLink = document.createElement('a'),
                vBlob = new Blob([JSON.stringify(oSave, null, 2)], {
                    type: "octet/stream"
                }),
                vName = Utils.replaceUnsupportedFileSigns(this._oModel.getProperty('/codeSettings/testName'), '_') + '.json',
                vUrl = window.URL.createObjectURL(vBlob);
            vLink.setAttribute('href', vUrl);
            vLink.setAttribute('download', vName);
            vLink.click();
        },

        /**
         *
         */
        onDownloadSource: function (oEvent) {
            var sSourceCode = oEvent.getSource().getParent().getContent().filter(c => c instanceof sap.ui.codeeditor.CodeEditor)[0].getValue();
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/javascript;charset=utf-8,' + encodeURIComponent(sSourceCode));
            var fileName = Utils.replaceUnsupportedFileSigns(oEvent.getSource().getParent().getText(), '_') + '.js';
            element.setAttribute('download', fileName);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();
            document.body.removeChild(element);
        },

        /**
         *
         */
        onDownloadAll: function (oEvent) {
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
                    .forEach(c => zip.file(c.fileName, c.source));
            }

            zip.generateAsync({
                type: "blob"
            })
                .then(content => saveAs(content, "testCode.zip"));
        },

        onShowReplayMessages: function(oEvent) {
            this._oMessagePopover.toggle(oEvent.getSource());
        },

        // #endregion

        // #region Event handling regarding event bus

        /**
         *
         * @param {string} sChannel the channel name of the incoming event (ignored)
         * @param {string} sEventId the event ID of the incoming event (ignored)
         * @param {*} oData the data on the selected element
         */
        _onItemSelected: function (sChannel, sEventId, oData) {
            if (this._oModel.getProperty("/replayMode")) {
                return; //NO!
            }

            RecordController.getInstance().setCurrentElement(oData);
            RecordController.getInstance().focusPopup();

            var sRouterTarget = this._bQuickMode ? "elementCreateQuick" : "elementCreate";
            this.getRouter().navTo(sRouterTarget, {
                TestId: RecordController.getInstance().getTestUUID(),
                ElementId: oData.identifier.ui5AbsoluteId
            });
        },

        /**
         *
         * @param {string} sChannel the channel name of the incoming event (ignored)
         * @param {string} sEventId the event ID of the incoming event (ignored)
         * @param {*} oData the data on the selected element
         */
        _onCheckRecordContinuing: function (sChannel, sEventId, oData) {
            var dialog = new Dialog({
                title: 'Start Recording?',
                type: 'Message',
                content: new Text({
                    text: 'Do you want to add additional test steps?'
                }),
                beginButton: new Button({
                    text: 'Yes',
                    tooltip: 'Starts the recording process',
                    press: function () {
                        RecordController.getInstance().startRecording();
                        dialog.close();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: 'No',
                    tooltip: 'No further actions',
                    // eslint-disable-next-line require-jsdoc
                    press: function () {
                        RecordController.getInstance().stopRecording();
                        dialog.close();
                    }.bind(this)
                }),
                // eslint-disable-next-line require-jsdoc
                afterClose: function () {
                    dialog.destroy();
                }
            });

            dialog.open();
        },

        /**
         *
         * @param {string} sChannel the channel name of the incoming event (ignored)
         * @param {string} sEventId the event ID of the incoming event (ignored)
         * @param {*} oMessages the messages sent during replay
         */
        _onReceiveReplayMessages: function(sChannel, sEventId, oMessages) {

            this._oModel.setProperty("/replayMessages", this._oModel.getProperty("/replayMessages").concat(oMessages));

            oMessages.forEach(function(oMsg) {
                this._oMessagePopover.addItem(new MessageItem(oMsg));

                if (oMsg.type === "Error") {
                    this._oMessagePopover.openBy(this.byId("replayMessagePopoverBtn"));
                }
            }.bind(this));

        },

        _resetReplayMessages: function() {
            // remove previously gathered replay messages
            this._oModel.setProperty("/replayMessages", []);
            this._oMessagePopover.destroyItems();
        },

        // #endregion

        // #region Miscellaneous

        /**
         *
         */
        _createDialog: function () {
            Fragment.load({
                name: "com.ui5.testing.fragment.RecordDialog",
                controller: this
            }).then(function(oRecordDialog) {
                this._oRecordDialog = oRecordDialog;
            }.bind(this));

            this._oMessagePopover = new MessagePopover();
        },

        /**
         *
         */
        _updatePreview: function () {
            var aStoredItems = RecordController.getInstance().getTestElements();
            var codeSettings = this.getModel('viewModel').getProperty('/codeSettings');
            codeSettings.language = this.getModel('settings').getProperty('/settings/defaultLanguage');
            codeSettings.execComponent = this.getOwnerComponent();
            this._oModel.setProperty("/codes", CodeHelper.getFullCode(codeSettings, aStoredItems));
        },

        /**
         *
         */
        _initTestCreate: function () {
            this._oModel.setProperty("/replayMode", false);
            this._resetReplayMessages();

            RecordController.getInstance().reset();
            RecordController.getInstance().initializeTestDetails();
            this._oModel.setProperty("/codeSettings/language", this.getModel("settings").getProperty("/settings/defaultLanguage"));
            this._oModel.setProperty("/codeSettings/authentification", this.getModel("settings").getProperty("/settings/defaultAuthentification"));
            ConnectionMessages.getWindowInfo(Connection.getInstance())
                .then(function (oData) {
                    if (!oData) {
                        return;
                    }
                    this._oModel.setProperty("/codeSettings/testName", oData.title);
                    this._oModel.setProperty("/codeSettings/testCategory", oData.title);
                    this._oModel.setProperty("/codeSettings/testUrl", oData.url);
                    this._oModel.setProperty("/codeSettings/ui5Version", oData.ui5Version);

                    // close record dialog if we have an immediate start
                    if (Connection.getInstance().isStartImmediately()) {
                        this._oRecordDialog.close();
                    } else {
                        this._oRecordDialog.open();
                    }

                    // start recording
                    RecordController.getInstance().startRecording();

                    this.getRouter().navTo("TestDetails", {
                        TestId: RecordController.getInstance().getTestUUID()
                    });
                }.bind(this));
        },

        // #endregion

    });
});
