import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import JourneyStorageService from "../service/JourneyStorage.service";
import Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import Menu from "sap/m/Menu";
import Button from "sap/m/Button";
import MenuItem from "sap/m/MenuItem";
import { Step } from "../model/class/Step.class";
import { AppSettings } from "../service/SettingsStorage.service";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import MessageToast from "sap/m/MessageToast";
import CodeGenerationService from "../service/CodeGeneration.service";
import { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { ChromeExtensionService } from "../service/ChromeExtension.service";

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
        this.model.attachPropertyChange(() => { this._propertyChanged(); });
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
            framework: settingsModel.testFramework,
            propertyChanged: false
        });
        this.setModel(this.setupModel, 'stepSetup');
        this.getRouter().getRoute("step").attachMatched((oEvent: Route$MatchedEvent) => {
            void this._loadStep(oEvent);
        });
    }

    async onSave() {
        const journey = await JourneyStorageService.getInstance().getById((this.getModel('stepSetup') as JSONModel).getProperty('/journeyId') as string);
        const step = Step.fromObject((this.getModel("step") as JSONModel).getData() as Partial<Step>);
        journey.updateStep(step);
        await JourneyStorageService.getInstance().save(journey);
        (this.getModel('stepSetup') as JSONModel).setProperty('/propertyChanged', false);
        MessageToast.show('Step saved!');
    }

    public async onValidate() {
        const step = Step.fromObject((this.getModel("step") as JSONModel).getData() as Partial<Step>);
        BusyIndicator.show(0);
        this.setConnecting()
        const url = step.actionLocation;
        try {
            await ChromeExtensionService.getInstance().reconnectToPage(url);
            this.setConnected();
            await ChromeExtensionService.getInstance().performAction(step, false);
            await ChromeExtensionService.getInstance().disconnect();
            this.setDisconnected();
            BusyIndicator.hide();
            MessageToast.show('Step is valid and executable', { duration: 2000 });
        } catch (e) {
            await ChromeExtensionService.getInstance().disconnect();
            this.setDisconnected();
            BusyIndicator.hide();
            MessageToast.show('An Error happened during validation', { duration: 2000 });
        }

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

    onFrameworkChange(oEvent: Event) {
        const oItem = oEvent.getParameter("item" as never) as MenuItem;
        (this.getModel('stepSetup') as JSONModel).setProperty('/framework', oItem.getText());
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

    private _propertyChanged() {
        (this.getModel('stepSetup') as JSONModel).setProperty('/propertyChanged', true);
    }

    private async _loadStep(oEvent: Event) {
        const oArgs: { id: string; stepId: string } = oEvent.getParameter("arguments" as never);
        const step = await JourneyStorageService.getInstance().getStepById({ journeyId: oArgs.id, stepId: oArgs.stepId });
        (this.getModel('stepSetup') as JSONModel).setProperty('/journeyId', oArgs.id);
        this.model.setData(step);
        this._generateStepCode();
    }

    private _generateStepCode(): void {
        const step = this.model.getData() as Step;
        let code = '';
        const paged = this.getModel('stepSetup').getProperty('/paged') as boolean;
        const framework = this.getModel('stepSetup').getProperty('/framework') as TestFrameworks;
        if (!paged) {
            code = CodeGenerationService.generateStepCode(step, framework);
        } else {
            code = CodeGenerationService.generatePagedStepCode(step, framework);
        }
        (this.getModel('stepSetup') as JSONModel).setProperty('/code', code);
    }
}