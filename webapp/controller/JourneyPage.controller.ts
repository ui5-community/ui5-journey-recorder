import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import JourneyStorageService from "../service/JourneyStorage.service";
import Event from "sap/ui/base/Event";
import DateFormat from "sap/ui/core/format/DateFormat";
import UI5Element from "sap/ui/core/Element";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Utils from "../model/class/Utils.class";
import Dialog from "sap/m/Dialog";
import { ButtonType, DialogType, FlexAlignContent, FlexAlignItems } from "sap/m/library";
import Button from "sap/m/Button";
import Text from "sap/m/Text";
import MessageToast from "sap/m/MessageToast";
import Journey from "../model/class/Journey.class";
import CodeGenerationService from "../service/CodeGeneration.service";
import Menu from "sap/m/Menu";
import Fragment from "sap/ui/core/Fragment";
import MenuItem from "sap/m/MenuItem";
import SettingsStorageService, { AppSettings } from "../service/SettingsStorage.service";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import { downloadZip } from "client-zip";
import { CodePage } from "../model/class/codeStrategies/CodePage.type";
import { ChromeExtensionService } from "../service/ChromeExtension.service";
import { RecordEvent, Step, UnknownStep } from "../model/class/Step.class";
import { RequestBuilder, RequestMethod } from "../model/class/RequestBuilder.class";
import VBox from "sap/m/VBox";
import CheckBox, { CheckBox$SelectEvent } from "sap/m/CheckBox";
import History from "sap/ui/core/routing/History";
import { ValueState } from "sap/ui/core/library";
import ChangeReason from "sap/ui/model/ChangeReason";
import { StepType } from "../model/enum/StepType";

type ReplayEnabledStep = Step & {
    state?: ValueState;
    executable?: boolean;
}

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class JourneyPage extends BaseController {
    private model: JSONModel;
    private _approveConnectDialog: Dialog;
    private _recordingDialog: Dialog;
    private _replayDialog: Dialog;
    private _frameworkMenu: Menu;

    onInit() {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/unbound-method
        this.getRouter().getRoute("journey").attachMatched(this._loadJourney, this);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/unbound-method
        this.getRouter().getRoute("recording").attachMatched(this._recordJourney, this);
    }

    onNavBack() {
        void JourneyStorageService.isChanged(Journey.fromObject((this.getModel('journey') as JSONModel).getData() as Partial<Journey>)).then((unsafed: boolean) => {
            if (unsafed) {
                this._openUnsafedDialog({
                    success: () => {
                        void ChromeExtensionService.getInstance().disconnect().then(() => {
                            this.setDisconnected();
                            const sPreviousHash = History.getInstance().getPreviousHash();
                            if (sPreviousHash?.indexOf('recording') > -1) {
                                this.getRouter().navTo("main");
                            } else {
                                super.onNavBack();
                            }
                        });
                    },
                    error: () => {
                        this.byId('saveBtn').focus();
                    }
                });
            } else {
                void ChromeExtensionService.getInstance().disconnect().then(() => {
                    this.setDisconnected();
                    const sPreviousHash = History.getInstance().getPreviousHash();
                    if (sPreviousHash?.indexOf('recording') > -1) {
                        this.getRouter().navTo("main");
                    } else {
                        super.onNavBack();
                    }
                });
            }
        });
    }

    onStepDelete(oEvent: Event) {
        const sPath = (oEvent.getSource()).getBindingContext('journey')?.sPath as string || '';
        if (sPath !== '') {
            const index = Number(sPath.replace('/steps/', ''));
            const jour = this.model.getData() as Journey;
            const steps = jour.steps;
            steps.splice(index, 1);
            this.model.setProperty('/steps', steps);
            this.model.firePropertyChange({
                reason: ChangeReason.Change,
                path: '/steps',
                value: steps
            });
        }
    }

    async onReplay() {
        const settings = (this.getModel('settings') as JSONModel).getData() as AppSettings;
        (this.getModel('journeyControl') as JSONModel).setProperty('/replaySettings', { delay: settings.replayDelay, manual: settings.manualReplayMode, rrSelectorUse: settings.useRRSelector });
        await this._openReplayDialog();
    }

    onRejectReplay() {
        this._replayDialog.close();
        (this.getModel('journeyControl') as JSONModel).setProperty('/replayEnabled', false);
    }

    async onStartReplay() {
        this._replayDialog.close();
        const replaySettings = (this.getModel('journeyControl') as JSONModel).getProperty('/replaySettings') as { delay: number, manual: boolean, rrSelectorUse: boolean };
        if (!(this.model.getData() as Journey).startUrl) {
            const unknownUrl = new Dialog({
                state: ValueState.Error,
                type: DialogType.Message,
                title: 'Unknown Url!',
                content: new Text({ text: "The current setup don't have a url to start from, this depends on the first step provided.\nRedefine your step setup and try again!" }),
                beginButton: new Button({
                    type: ButtonType.Critical,
                    text: 'Ok',
                    press: () => {
                        unknownUrl.close();
                        unknownUrl.destroy();
                    }
                })
            });
            unknownUrl.open();
            return
        }

        const url = this.model.getProperty('/startUrl') as string;
        await this.onConnect(url);

        (this.getModel('journeyControl') as JSONModel).setProperty('/replayEnabled', true);
        if (!replaySettings.manual) {
            await this._startAutomaticReplay(replaySettings.delay, replaySettings.rrSelectorUse);
        } else {
            MessageToast.show('Replay engaged!');
            this._startManualReplay(replaySettings.rrSelectorUse);
        }
    }

    async onStopReplay() {
        (this.getModel('journeyControl') as JSONModel).setProperty('/replayEnabled', false);
        (this.getModel('journeyControl') as JSONModel).setProperty('/manualReplay', true);
        await this.onDisconnect();
    }
    onChangeReplayDelay(oEvent: Event) {
        const index = oEvent.getParameter("selectedIndex" as never);
        switch (index) {
            case 0:
                (this.getModel("journeyControl") as JSONModel).setProperty('/replaySettings/delay', 0.5);
                break;
            case 1:
                (this.getModel("journeyControl") as JSONModel).setProperty('/replaySettings/delay', 1.0);
                break;
            case 2:
                (this.getModel("journeyControl") as JSONModel).setProperty('/replaySettings/delay', 2.0);
                break;
            default:
                (this.getModel("journeyControl") as JSONModel).setProperty('/replaySettings/delay', 0.5);
        }
    }

    onReorderItems(event: Event) {
        const movedId = event.getParameter('draggedControl').getBindingContext('journey').getObject().id as string;
        const droppedId = event.getParameter('droppedControl').getBindingContext('journey').getObject().id as string;
        this._moveStep(movedId, droppedId);
        this._generateCode(Journey.fromObject(this.model.getData() as Partial<Journey>));
    }

    onAddStep() {
        const steps = (this.model.getData() as Journey).steps;
        steps.push(new UnknownStep());
        this.model.setProperty('/steps', steps);
    }

    private _moveStep(movedStepId: string, anchorStepId: string) {
        let steps = (this.model.getData() as Journey).steps;
        const movedIndex = steps.findIndex(s => s.id === movedStepId);
        const anchorIndex = steps.findIndex(s => s.id === anchorStepId);
        steps = Utils.moveInArray(steps, movedIndex, anchorIndex);
        this.model.setProperty('/steps', steps);
    }

    private async _startAutomaticReplay(delay: number, rrSelectorUse: boolean) {
        BusyIndicator.show(0);
        const journeySteps = (this.model.getData() as Journey).steps as ReplayEnabledStep[];
        for (let index = 0; index < journeySteps.length; index++) {
            await Utils.delay(1000 * delay)
            const curStep = journeySteps[index];
            try {
                this.model.setProperty(`/steps/${index}/state`, ValueState.Information);
                await ChromeExtensionService.getInstance().performAction(curStep, rrSelectorUse);
                this.model.setProperty(`/steps/${index}/state`, ValueState.Success);
            } catch (e) {
                this.model.setProperty(`/steps/${index}/state`, ValueState.Error);
                MessageToast.show('An Error happened during testing', { duration: 3000 });
                BusyIndicator.hide();
                await this.onStopReplay();
                return;
            }
        }
        BusyIndicator.hide();
        await this.onStopReplay();
        MessageToast.show('All tests executed successfully', { duration: 3000 });
    }

    private _startManualReplay(rrSelectorUse: boolean) {
        const model = (this.getModel('journeyControl') as JSONModel);

        model.setProperty('/manualReplay', true);
        model.setProperty('/manualReplayIndex', 0);
        model.setProperty('/manualReplayRRSelector', rrSelectorUse);
        this.model.setProperty(`/steps/0/executable`, true);
    }

    public async executeTestStep() {
        const journeySteps = (this.model.getData() as Journey).steps as ReplayEnabledStep[];
        const model = (this.getModel('journeyControl') as JSONModel);
        const index = model.getProperty('/manualReplayIndex') as number;
        const rrSelectorUse = model.getProperty('/manualReplayRRSelector') as boolean;

        const curStep = journeySteps[index];
        try {
            this.model.setProperty(`/steps/${index}/state`, ValueState.Information);
            await ChromeExtensionService.getInstance().performAction(curStep, rrSelectorUse);
            this.model.setProperty(`/steps/${index}/state`, ValueState.Success);
            model.setProperty('/manualReplayIndex', index + 1);
            this.model.setProperty(`/steps/${index}/executable`, false);

            if (index === (journeySteps.length - 1)) {
                await this.onStopReplay();
                MessageToast.show('All tests executed successfully', { duration: 3000 });
                return;
            }

            if (journeySteps[index + 1].actionType === StepType.UNKNOWN) {
                this.model.setProperty(`/steps/${index + 1}/state`, ValueState.Error);
                this.model.setProperty(`/steps/${index + 1}/executable`, false);
                const unknownStepDialog = new Dialog({
                    state: ValueState.Error,
                    type: DialogType.Message,
                    title: 'Unknown Step!',
                    content: new Text({ text: "The next step defines an unknown action, please redefine the Step and retest again!" }),
                    beginButton: new Button({
                        type: ButtonType.Negative,
                        text: 'Ok',
                        press: () => {
                            unknownStepDialog.close();
                            unknownStepDialog.destroy();
                            BusyIndicator.hide();
                            void this.onStopReplay();
                        }
                    })
                });
                unknownStepDialog.open();
                return;
            }

            if (index + 1 < journeySteps.length) {
                this.model.setProperty(`/steps/${index + 1}/executable`, true);
            }
        } catch (e) {
            this.model.setProperty(`/steps/${index}/state`, ValueState.Error);
            this.model.setProperty(`/steps/${index}/executable`, false);
            MessageToast.show('An Error happened during testing', { duration: 3000 });
            BusyIndicator.hide();
            await this.onStopReplay();
            return;
        }
    }

    navigateToStep(oEvent: Event) {
        const source: UI5Element = oEvent.getSource();
        const bindingCtx = source.getBindingContext('journey');
        const journeyId = ((bindingCtx.getModel() as JSONModel).getData() as Partial<Journey>).id;
        const stepId = bindingCtx.getProperty("id") as string;
        const stepType = bindingCtx.getProperty("actionType") as StepType;
        if (stepType === StepType.UNKNOWN) {
            this.getRouter().navTo('step-define', { id: journeyId, stepId: stepId });
        } else {
            this.getRouter().navTo('step', { id: journeyId, stepId: stepId });
        }
    }

    dateTimeFormatter(value: number) {
        if (value) {
            const oDateFormat = DateFormat.getDateTimeInstance({ pattern: "MM/dd/yyyy - hh:mm" });
            return oDateFormat.format(new Date(value));
        } else {
            return value;
        }
    }

    async onExport() {
        const unsafed = (this.getModel('journeyControl') as JSONModel).getProperty('/unsafed') as boolean;

        if (unsafed) {
            this._openUnsafedDialog({
                success: async () => {
                    await this._export();
                    BusyIndicator.hide();
                },
                error: () => {
                    this.byId('saveBtn').focus();
                    BusyIndicator.hide();
                }
            })
        } else {
            await this._export();
            BusyIndicator.hide();
        }
    }

    async onSave() {
        await JourneyStorageService.getInstance().save(this.model.getData() as Journey);
        (this.getModel('journeyControl') as JSONModel).setProperty('/unsafed', false);
        MessageToast.show('Journey saved!');
    }

    async frameworkChange($event: Event) {
        const button: Button = $event.getSource();
        if (!this._frameworkMenu) {
            this._frameworkMenu = await Fragment.load({
                id: this.getView().getId(),
                name: "com.ui5.journeyrecorder.fragment.TestFrameworkMenu",
                controller: this
            }) as Menu;
            this.getView().addDependent(this._frameworkMenu);
        }
        this._frameworkMenu.openBy(button, false);
    }

    onFrameworkChange(oEvent: Event) {
        const oItem = oEvent.getParameter("item" as never) as MenuItem;
        (this.getModel('journeyControl') as JSONModel).setProperty('/framework', oItem.getText());
        const journey = (this.getModel('journey') as JSONModel).getData() as Journey;
        this._generateCode(journey);
    }

    onSelectCodeTab(oEvent: Event) {
        const codeId = oEvent.getParameter("selectedKey" as never) as string;
        const modelData = (this.getModel('journeyControl') as JSONModel).getData() as Record<string, unknown>;
        const generatedCode = modelData['codes'] as CodePage[];
        const page = generatedCode.find((cp: CodePage) => cp.title === codeId);
        (this.getModel('journeyControl') as JSONModel).setProperty('/activeCode', page.code);
    }

    async onCopyCode() {
        await navigator.clipboard.writeText((this.getModel('journeyControl') as JSONModel).getProperty('/activeCode') as string);
        MessageToast.show("Code copied");
    }

    async onCodeDownload() {
        const modelData = (this.getModel('journeyControl') as JSONModel).getData() as Record<string, unknown>;
        const generatedCode = modelData['codes'] as CodePage[];
        const journey = (this.getModel('journey') as JSONModel).getData() as Partial<Journey>;

        const files = [];
        const framework = modelData.framework;
        if (framework === TestFrameworks.OPA5) {
            const journeyPage = generatedCode.find((p) => p.type === 'journey');
            const viewPages = generatedCode.filter((p) => p.type === 'page');

            const jourName = `${Utils.replaceUnsupportedFileSigns(journeyPage?.title || '', '_')}.js`;
            files.push({ name: `integration/${jourName}`, input: (journeyPage?.code as string || '') });

            viewPages.forEach((p) => {
                const name = `${Utils.replaceUnsupportedFileSigns(p.title, '_')}.js`;
                files.push({ name: `integration/pages/${name}`, input: (p.code as string || '') });
            });

        } else {
            generatedCode.forEach((p) => {
                const name = `${Utils.replaceUnsupportedFileSigns(p.title, '_')}.js`;
                files.push({
                    name: `wdi5_test/${name}`,
                    input: p.code as string
                });
            });
        }
        // get the ZIP stream in a Blob
        const blob = await downloadZip(files).blob()

        // make and click a temporary link to download the Blob
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${Utils.replaceUnsupportedFileSigns(journey.name, '_')}.zip`
        link.click()
        link.remove()
    }

    async onStopRecording() {
        this._recordingDialog.close();
        BusyIndicator.show();
        const ui5Version = await this._requestUI5Version();
        const data = this.model.getData() as Partial<Journey>;
        data.ui5Version = ui5Version;
        const journey = JourneyStorageService.createJourneyFromRecording(data);
        ChromeExtensionService.getInstance().unregisterRecordingWebsocket(
            // eslint-disable-next-line @typescript-eslint/unbound-method
            this._onStepRecord,
            this
        );
        BusyIndicator.hide();
        this.model.setData(journey);
        (this.getModel('journeyControl') as JSONModel).setProperty('/unsafed', true);
        this._generateCode(journey);
    }

    private _generateCode(journey: Journey) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const framework = (this.getModel('journeyControl') as JSONModel).getProperty('/framework') as TestFrameworks;
        const codes = CodeGenerationService.generateJourneyCode(journey, framework);
        (this.getModel('journeyControl') as JSONModel).setProperty('/codes', codes);
    }

    private async _export() {
        const jour = await JourneyStorageService.getInstance().getById(this.model.getProperty('/id') as string);
        const link = document.createElement('a');
        const blob = new Blob([jour.toString() || ''], {
            type: 'octet/stream'
        });
        const name = Utils.replaceUnsupportedFileSigns((this.model.getProperty('/name') as string) || 'blub', '_') + '.json';
        link.setAttribute('href', window.URL.createObjectURL(blob));
        link.setAttribute('download', name);
        link.click();
        link.remove();
    }

    private _setToUnsafed() {
        (this.getModel('journeyControl') as JSONModel).setProperty('/unsafed', true);
    }

    private async _loadJourney(oEvent: Event) {
        await this._setupJourneyControlModel();
        const oArgs: { id: string } = oEvent.getParameter("arguments" as never);
        const journey = await JourneyStorageService.getInstance().getById(oArgs.id);
        this.model = new JSONModel(journey);
        this.setModel(this.model, 'journey');
        this.model.attachPropertyChange(() => {
            this._setToUnsafed();
            this._generateCode(this.model.getData() as Journey);
        });
        this._generateCode(journey);
    }

    private async _recordJourney(oEvent: Event) {
        BusyIndicator.show();
        await this._setupJourneyControlModel();
        const { tabId } = oEvent.getParameter('arguments' as never) as { tabId: number };
        const tab = await ChromeExtensionService.getTabInfoById(tabId);
        this.model = new JSONModel({ name: tab.title });
        this.setModel(this.model, 'journey');

        const settingsModel = (this.getModel('settings') as JSONModel).getData() as AppSettings;
        let reload = settingsModel.reloadPageDefault;
        const connectFn = () => {
            BusyIndicator.show();
            this._approveConnectDialog.close();
            this.setConnecting();
            ChromeExtensionService.getInstance().setCurrentTab(tab);
            ChromeExtensionService.getInstance().connectToCurrentTab(reload).then(async () => {
                ChromeExtensionService.getInstance().registerRecordingWebsocket(
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    this._onStepRecord,
                    this
                )
                this.setConnected();
                void ChromeExtensionService.getInstance().focusTab(tab);
                BusyIndicator.hide();
                await this._openRecordingDialog();
                MessageToast.show('Connected');
            }).catch(() => {
                BusyIndicator.hide();
            });
        };


        if (!this._approveConnectDialog) {
            const dialogContent = new VBox({
                alignItems: FlexAlignItems.Start,
                justifyContent: FlexAlignContent.Start
            });
            dialogContent.addItem(
                new Text({ text: `Connect to the tab "${tab.title}" and inject analytic scripts?` })
            );
            const chkBox =
                new CheckBox({ text: 'Reload tab', selected: reload });
            chkBox.attachSelect((p1: CheckBox$SelectEvent) => {
                reload = p1.getParameter("selected");
            })
            dialogContent.addItem(
                chkBox
            );
            this._approveConnectDialog = new Dialog({
                type: DialogType.Message,
                title: 'Connect to tab',
                content: dialogContent,
                beginButton: new Button({
                    type: ButtonType.Accept,
                    text: "Connect!",
                    press: connectFn
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: () => {
                        this._approveConnectDialog.close()
                    }
                })
            });
        } else {
            const dialogContent = this._approveConnectDialog.getAggregation('content') as sap.ui.core.Control[];
            ((dialogContent[0] as VBox).getItems()[0] as Text).setText(`Connect to the tab "${tab.title}" and inject analytic scripts?`);
            this._approveConnectDialog.getBeginButton().attachPress(connectFn);
        }
        BusyIndicator.hide();
        this._approveConnectDialog.open();
    }

    private async _setupJourneyControlModel() {
        this.setModel(new JSONModel({ titleVisible: true, titleInputVisible: false, replayEnabled: false }), 'journeyControl');
        const settings = (await SettingsStorageService.getSettings());
        (this.getModel('journeyControl') as JSONModel).setProperty('/framework', settings.testFramework);
    }

    private async _openRecordingDialog() {
        if (!this._recordingDialog) {
            this._recordingDialog = await this.loadFragment({
                name: "com.ui5.journeyrecorder.fragment.RecordingDialog"
            }) as Dialog;
            this.getView().addDependent(this._recordingDialog);
        }
        (this._recordingDialog).open();
    }

    private async _openReplayDialog() {
        if (!this._replayDialog) {
            this._replayDialog = await this.loadFragment({
                name: "com.ui5.journeyrecorder.fragment.ReplayStartDialog"
            }) as Dialog;
            this.getView().addDependent(this._replayDialog);
        }
        (this._replayDialog).open();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _onStepRecord(_1: string, _2: string, recordData: object) {
        const data = this.model.getData() as { name: string; steps?: Step[] };
        const newStep = Step.recordEventToStep(recordData as RecordEvent);
        if (!data.steps) {
            data.steps = [];
        }
        data.steps.push(newStep);
        this.model.setData(data);
    }

    private async _requestUI5Version() {
        const req = new RequestBuilder()
            .setMethod(RequestMethod.GET)
            .setUrl('/pageInfo/version')
            .build();
        const version = await ChromeExtensionService.getInstance().sendSyncMessage(req) as { message: string };
        return version.message;
    }
}