import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import JourneyStorageService from "../service/JourneyStorage.service";
import Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import Menu from "sap/m/Menu";
import Button from "sap/m/Button";
import MenuItem from "sap/m/MenuItem";
import { RecordEvent, Step } from "../model/class/Step.class";
import { AppSettings } from "../service/SettingsStorage.service";
import { CodeStyles, TestFrameworks } from "../model/enum/TestFrameworks";
import MessageToast from "sap/m/MessageToast";
import CodeGenerationService from "../service/CodeGeneration.service";
import { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { ChromeExtensionService } from "../service/ChromeExtension.service";
import Utils from "../model/class/Utils.class";
import Dialog from "sap/m/Dialog";
import Text from "sap/m/Text";
import { DialogType } from "sap/m/library";
import { ValueState } from "sap/ui/core/library";

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class StepPage extends BaseController {
    private model: JSONModel;
    private setupModel: JSONModel;
    private frameworkMenu: Menu;
    private stepMenu: Menu;

    onInit() {
        this.model = new JSONModel({});
        this.setModel(this.model, 'step');
        const settingsModel = (this.getOwnerComponent().getModel('settings') as JSONModel).getData() as AppSettings;
        this.setupModel = new JSONModel({
            codeStyle: 'javascript',
            code: `module.exports = function (config) {
                "use strict";
            
                config.set({
                    frameworks: ["ui5"],
                    browsers: ["Chrome"]
                });
            };`,
            paged: settingsModel.pagedDefault,
            framework: settingsModel.framework,
            propertyChanged: false
        });
        this.setModel(this.setupModel, 'stepSetup');
        this.getRouter().getRoute("step").attachMatched((oEvent: Route$MatchedEvent) => {
            void this._loadStep(oEvent);
        });
        this.getRouter().getRoute("step-define").attachMatched((oEvent: Route$MatchedEvent) => {
            void this._startStepDefinition(oEvent);
        });
    }

    async onSave() {
        const journey = await JourneyStorageService.getInstance().getById((this.getModel('stepSetup') as JSONModel).getProperty('/journeyId') as string);
        const step = Step.fromObject((this.getModel("step") as JSONModel).getData() as Partial<Step>);
        journey.updateStep(step);
        await JourneyStorageService.getInstance().save(journey);
        MessageToast.show('Step saved!');
    }

    async typeChange($event: Event) {
        const button: Button = $event.getSource();
        if (!this.stepMenu) {
            this.stepMenu = await Fragment.load({
                id: this.getView().getId(),
                name: "com.ui5.journeyrecorder.fragment.StepTypeMenu",
                controller: this
            }) as Menu;
            this.getView().addDependent(this.stepMenu);
        }
        this.stepMenu.openBy(button, false);
    }

    async frameworkChange($event: Event) {
        const button: Button = $event.getSource();
        if (!this.frameworkMenu) {
            this.frameworkMenu = await Fragment.load({
                id: this.getView().getId(),
                name: "com.ui5.journeyrecorder.fragment.TestFrameworkMenu",
                controller: this
            }) as Menu;
            this.getView().addDependent(this.frameworkMenu);
        }
        this.frameworkMenu.openBy(button, false);
    }

    async onStepRemove() {
        const jId = this.getModel('stepSetup').getProperty('/journeyId') as string;
        const id = this.model.getProperty('/id') as string;
        const journey = await JourneyStorageService.getInstance().getById(jId);
        if (journey) {
            const index = journey.steps.findIndex(step => step.id === id);
            journey.steps.splice(index, 1);
            this.navTo("journey", { id: journey.id });
        }
    }

    onStepTypeChange(oEvent: Event) {
        const oItem = oEvent.getParameter("item" as never) as MenuItem;
        (this.getModel('step') as JSONModel).setProperty('/actionType', oItem.getKey());
    }

    onCodeCriteriaChanged() {
        this._generateStepCode();
    }

    getAttributeCount(property: unknown[]): number {
        return property?.length || 0;
    }

    getAttributeVisibility(property: unknown[]): boolean {
        return property?.length > 0;
    }

    async onCopyCode() {
        await navigator.clipboard.writeText((this.getModel('stepSetup') as JSONModel).getProperty('/code') as string);
        MessageToast.show("Code copied");
    }

    async onReselect() {
        await this._startRedefinition();
    }

    private async _loadStep(oEvent: Event) {
        const oArgs: { id: string; stepId: string } = oEvent.getParameter("arguments" as never);
        const step = await JourneyStorageService.getInstance().getStepById({ journeyId: oArgs.id, stepId: oArgs.stepId });
        if (!step) {
            this.onNavBack();
            return;
        }
        (this.getModel('stepSetup') as JSONModel).setProperty('/journeyId', oArgs.id);
        this.model.setData(step);
        this._generateStepCode();
    }

    private async _startStepDefinition(oEvent: Event) {
        const oArgs: { id: string; stepId: string } = oEvent.getParameter("arguments" as never);
        const step = await JourneyStorageService.getInstance().getStepById({ journeyId: oArgs.id, stepId: oArgs.stepId });
        if (!step) {
            this.onNavBack();
            return;
        }
        (this.getModel('stepSetup') as JSONModel).setProperty('/journeyId', oArgs.id);
        this.model.setData(step);

        await this._startRedefinition();
    }

    private async _startRedefinition() {
        BusyIndicator.show(0);
        // 1. get all steps
        const jour = await JourneyStorageService.getInstance().getById((this.getModel('stepSetup') as JSONModel).getProperty('/journeyId') as string);
        const steps = jour.steps;
        const selfIndex = steps.findIndex((s: Step) => s.id === (this.model.getData() as Step).id);
        const settings = (this.getModel('settings') as JSONModel).getData() as AppSettings;
        await this.onConnect(jour.startUrl);
        BusyIndicator.show(0);
        for (let index = 0; index < steps.length; index++) {
            await Utils.delay(1000 * settings.replayDelay)

            if (index === selfIndex) {
                //set "backend" to record mode
                const selectElementDialog = new Dialog({
                    state: ValueState.Information,
                    type: DialogType.Message,
                    title: 'Waiting for element select...',
                    content: new Text({ text: "Please select an element at your UI5 application to redefine this step!" })
                });

                const onStepRerecord = (_1: string, _2: string, recordData: object) => {
                    const newStep = Step.recordEventToStep(recordData as RecordEvent);
                    jour.steps[selfIndex] = newStep;
                    this.model.setData(newStep);
                    ChromeExtensionService.getInstance().unregisterRecordingWebsocket(onStepRerecord, this);
                    ChromeExtensionService.getInstance().disableRecording().then(() => { }).catch(() => { }).finally(() => {
                        selectElementDialog.close();
                        selectElementDialog.destroy();
                        BusyIndicator.hide();
                        this.onDisconnect().then(() => { }).catch(() => { });
                    })

                    //assume the journey is call by reference it should work
                };

                ChromeExtensionService.getInstance().registerRecordingWebsocket(onStepRerecord, this);
                await ChromeExtensionService.getInstance().enableRecording();
                selectElementDialog.open();
                break;
            } else {
                const curStep = steps[index];
                try {
                    await ChromeExtensionService.getInstance().performAction(curStep, settings.useRRSelector);
                } catch (e) {
                    await this.onDisconnect();
                    MessageToast.show('An Error happened during replay former steps', { duration: 3000 });
                    BusyIndicator.hide();
                    return;
                }
            }
        }
        // replay the steps before this step by connecting to the page. 
        // after the first click take the found element and action as new step setting
        // store and setup the step accordingly
    }

    private _generateStepCode(): void {
        const oViewModel = this.getModel('stepSetup');
        const step = this.model.getData() as Step;
        const framework = oViewModel.getProperty('/framework') as TestFrameworks;
        const style = oViewModel.getProperty('/style') as CodeStyles;
        CodeGenerationService.generateStepCode(step, { framework, style }).then((generatedCode) => {
            (oViewModel as JSONModel).setProperty('/code', generatedCode);
        });
    }
}