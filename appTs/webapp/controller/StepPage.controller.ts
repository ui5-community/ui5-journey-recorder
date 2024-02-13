import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import JourneyStorageService from "../service/JourneyStorage.service";
import Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import Menu from "sap/m/Menu";
import Button from "sap/m/Button";
import MenuItem from "sap/m/MenuItem";
import MessageToast from "sap/m/MessageToast";

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
        this.setupModel = new JSONModel({
            codeStyle: 'javascript',
            code: `module.exports = function (config) {
                "use strict";
            
                config.set({
                    frameworks: ["ui5"],
                    browsers: ["Chrome"]
                });
            };`
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
        let oItem = oEvent.getParameter("item") as any;
        let sItemPath = "";

        while (oItem instanceof MenuItem) {
            sItemPath = oItem.getText() + " > " + sItemPath;
            oItem = oItem.getParent();
        }

        sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));

        MessageToast.show("Action triggered on item: " + sItemPath);
    }

    onFrameworkChange(oEvent: Event) {
        let oItem = oEvent.getParameter("item") as any;
        let sItemPath = "";

        while (oItem instanceof MenuItem) {
            sItemPath = oItem.getText() + " > " + sItemPath;
            oItem = oItem.getParent();
        }

        sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));

        MessageToast.show("Action triggered on item: " + sItemPath);
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
    }
}