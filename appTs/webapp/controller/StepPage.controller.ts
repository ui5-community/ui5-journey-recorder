import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import JourneyStorageService from "../service/JourneyStorage.service";
import Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import Menu from "sap/m/Menu";
import Button from "sap/m/Button";
import MenuItem from "sap/m/MenuItem";
import MessageToast from "sap/m/MessageToast";
import OPA5CodeStrategy from "../model/class/codeStrategies/opa5/OPA5CodeStrategy.class";
import { Step } from "../model/class/Step.class";
import { AppSettings } from "../service/SettingsStorage.service";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import Wdi5CodeStrategy from "../model/class/codeStrategies/wdi5/Wdi5CodeStrategy.class";

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class StepPage extends BaseController {
    private model: JSONModel;
    private setupModel: JSONModel;
    private menu: Menu;

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
            framework: settingsModel.testFramework
        });
        this.setModel(this.setupModel, 'stepSetup');
        this.getRouter().getRoute("step").attachMatched(this._loadStep, this);
    }

    async typeChange($event: Event) {
        const button: Button = $event.getSource();
        if (!this.menu) {
            this.menu = await Fragment.load({
                id: this.getView().getId(),
                name: "com.ui5.journeyrecorder.fragment.StepTypeMenu",
                controller: this
            }) as Menu;
        }
        this.menu.openBy(button, false);
    }

    async frameworkChange($event: Event) {
        const button: Button = $event.getSource();
        if (!this.menu) {
            this.menu = await Fragment.load({
                id: this.getView().getId(),
                name: "com.ui5.journeyrecorder.fragment.TestFrameworkMenu",
                controller: this
            }) as Menu;
        }
        this.menu.openBy(button, false);
    }

    onStepTypeChange(oEvent: Event) {
        let oItem = oEvent.getParameter("item" as never) as MenuItem;
        let sItemPath = "";

        while (oItem instanceof MenuItem) {
            sItemPath = oItem.getText() + " > " + sItemPath;
            oItem = oItem.getParent();
        }

        sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));
        MessageToast.show("Action triggered on item: " + sItemPath);
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

    private async _loadStep(oEvent: Event) {
        const oArgs: { id: string; stepId: string } = oEvent.getParameter("arguments" as never);
        const step = await JourneyStorageService.getInstance().getStepById({ journeyId: oArgs.id, stepId: oArgs.stepId });
        this.model.setData(step);
        this._generateStepCode();
    }

    private _generateStepCode(): void {
        const step = this.model.getData() as Step;
        let code = '';
        const paged = this.getModel('stepSetup').getProperty('/paged') as boolean;
        const framework = this.getModel('stepSetup').getProperty('/framework') as TestFrameworks;
        const strategy = framework === TestFrameworks.WDI5 ? Wdi5CodeStrategy : OPA5CodeStrategy;
        if (!paged) {
            code = strategy.generateStepCode(step);
        } else {
            code = '!!!PAGED NOT IMPLEMENTED !!!';
        }
        (this.getModel('stepSetup') as JSONModel).setProperty('/code', code);
    }
}