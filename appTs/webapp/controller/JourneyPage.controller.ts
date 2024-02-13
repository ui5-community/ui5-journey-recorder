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

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class JourneyPage extends BaseController {
    private model: JSONModel;
    private _unsafeDialog: Dialog;
    private _editor: CodeEditor;

    onInit(): void {
        this.model = new JSONModel({});
        this.setModel(this.model, 'journey');
        this.setModel(new JSONModel({ titleVisible: true, titleInputVisible: false }), 'journeyControl');
        this.getRouter().getRoute("journey").attachMatched(this._loadJourney, this);
        this.model.attachEvent('propertyChange', null, this._setToUnsafed, this);
        this._editor = this.byId('codeeditor');
        this._generateCode();
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
        const journeyId = bindingCtx.oModel.getData().id;
        const stepId = bindingCtx.getProperty("id");
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

    onSelectCodeTab(oEvent: Event) {
        const codeId = oEvent.getParameter("selectedKey" as never) as string;
        const modelData = (this.getModel('journeyControl') as JSONModel).getData() as Record<string, unknown>;
        const generatedCode = modelData['generatedCode'] as Record<string, string>;
        const codeString = generatedCode[codeId];
        (this.getModel('journeyControl') as JSONModel).setProperty('/activeCode', codeString);
    }

    private _generateCode() {
        const codeParts: Record<string, string> = {
            "Code Part 1": "function loadDoc() {\n\treturn 'bar';\n}",
            "Code Part 2": "function myFunction(p1, p2) {\n\treturn 'foo';\n}"
        };
        const codeNames = [{
            name: "Code Part 1"
        }, {
            name: "Code Part 2"
        }];
        (this.getModel('journeyControl') as JSONModel).setProperty('/codeNames', codeNames);
        (this.getModel('journeyControl') as JSONModel).setProperty('/generatedCode', codeParts);
        (this.getModel('journeyControl') as JSONModel).setProperty('/activeCode', codeParts[codeNames[0].name]);
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
    }

    private _setToUnsafed() {
        (this.getModel('journeyControl') as JSONModel).setProperty('/unsafed', true);
    }
}