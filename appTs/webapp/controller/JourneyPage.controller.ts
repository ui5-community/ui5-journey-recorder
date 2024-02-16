import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import JourneyStorageService from "../service/JourneyStorage.service";
import Event from "sap/ui/base/Event";
import DateFormat from "sap/ui/core/format/DateFormat";
import UI5Element from "sap/ui/core/Element";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Utils from "../model/class/Utils.class";
import Dialog from "sap/m/Dialog";
import { ButtonType, DialogType } from "sap/m/library";
import { ValueState } from "sap/ui/core/library";
import Button from "sap/m/Button";
import Text from "sap/m/Text";
import MessageToast from "sap/m/MessageToast";
import Journey from "../model/class/Journey.class";
import CodeEditor from "sap/ui/codeeditor";
import CodeGenerationService from "../service/CodeGeneration.service";
import Menu from "sap/m/Menu";
import Fragment from "sap/ui/core/Fragment";
import MenuItem from "sap/m/MenuItem";
import SettingsStorageService from "../service/SettingsStorage.service";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import { CodePage } from "../model/class/codeStrategies/opa5/OPA5CodeStrategy.class";
import { downloadZip } from "client-zip";
/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class JourneyPage extends BaseController {
    private model: JSONModel;
    private _unsafeDialog: Dialog;
    private _editor: CodeEditor;
    private _frameworkMenu: Menu;

    async onInit() {
        this.model = new JSONModel({});
        this.setModel(this.model, 'journey');
        this.setModel(new JSONModel({ titleVisible: true, titleInputVisible: false, }), 'journeyControl');
        this.getRouter().getRoute("journey").attachMatched((oEvent) => { void this._loadJourney(oEvent); });
        this.model.attachEvent('propertyChange', null, () => { this._setToUnsafed(); }, this);
        this._editor = this.byId('codeeditor');
        const settings = (await SettingsStorageService.getSettings());
        (this.getModel('journeyControl') as JSONModel).setProperty('/framework', settings.testFramework);
    }

    toTitleEdit() {
        this.model.setProperty('/titleVisible', false);
        this.model.setProperty('/titleInputVisible', true);
    }

    toTitleShow() {
        this.model.setProperty('/titleVisible', true);
        this.model.setProperty('/titleInputVisible', false);
    }

    navigateToStep(oEvent: Event) {
        const source: UI5Element = oEvent.getSource();
        const bindingCtx = source.getBindingContext('journey');
        const journeyId = ((bindingCtx.getModel() as JSONModel).getData() as Partial<Journey>).id;
        const stepId = bindingCtx.getProperty("id") as string;
        this.getRouter().navTo('step', { id: journeyId, stepId: stepId });
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
            if (!this._unsafeDialog) {
                this._unsafeDialog = new Dialog({
                    type: DialogType.Message,
                    state: ValueState.Warning,
                    title: 'Unsafed Changes!',
                    content: new Text({ text: "You have unsafed changes, proceed?" }),
                    beginButton: new Button({
                        type: ButtonType.Attention,
                        text: 'Proceed',
                        press: () => {
                            this._unsafeDialog.close();
                            void this._export().then(() => {
                                BusyIndicator.hide();
                            });
                        }
                    }),
                    endButton: new Button({
                        text: 'Cancel',
                        press: () => {
                            this._unsafeDialog.close();
                            this.byId('saveBtn').focus();
                            BusyIndicator.hide();
                        }
                    })
                })
            }
            this._unsafeDialog.open();
        } else {
            await this._export();
            BusyIndicator.hide();
        }
    }

    async onSave() {
        await JourneyStorageService.getInstance().save(this.model.getData() as Journey)
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

    private async _loadJourney(oEvent: Event) {
        const oArgs: { id: string } = oEvent.getParameter("arguments" as never);
        const journey = await JourneyStorageService.getInstance().getById(oArgs.id);
        this.model.setData(journey);
        this._generateCode(journey);
    }

    private _setToUnsafed() {
        (this.getModel('journeyControl') as JSONModel).setProperty('/unsafed', true);
    }
}