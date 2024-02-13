import UI5Element from "sap/ui/core/Element";
import BaseController from "./BaseController";
import Dialog from "sap/m/Dialog";
import JSONModel from "sap/ui/model/json/JSONModel";
import History from "sap/ui/core/routing/History";
import Router from "sap/m/routing/Router";
import Event from "sap/ui/base/Event";
import Button from "sap/m/Button";
import EventProvider from "sap/ui/base/EventProvider";
import SettingsStorageService, { AppSettings } from "../service/SettingsStorage.service";
import RadioButton from "sap/m/RadioButton";
import { CodeStyles } from "../model/enum/CodeStyles";
import { Themes } from "../model/enum/Themes";
import Theming from "sap/ui/core/Theming";

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class App extends BaseController {
	private settingsDialog: UI5Element;
	public onInit(): void {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

		this._setupNavButtonVisibility();
	}

	public onAfterRendering(): void {
		// we have to set the content to a fix height, calculated as below
		// because we use the app-view as 
		const element = document.querySelector('div.app-root > section');
		if (element) {
			(element as HTMLElement).style.height = "calc(100% - 5.5rem)";
		}
	}

	backNav() {
		const oHistory = History.getInstance();
		const sPreviousHash = oHistory.getPreviousHash();

		if (sPreviousHash !== undefined) {
			window.history.go(-1);
		} else {
			this.getRouter().navTo("main", {}, true /*no history*/);
		}
	}

	async onOpenDialog() {
		if (!this.settingsDialog) {
			this.settingsDialog = await this.loadFragment({
				name: "com.ui5.journeyrecorder.fragment.SettingsDialog"
			}) as UI5Element;
			this.getView().addDependent(this.settingsDialog);
		}
		(this.settingsDialog as Dialog).open();
	}

	onCloseDialog(oEvent: Event) {
		const closeReason = (oEvent.getSource()).data("settingsDialogClose") as string;
		if (closeReason === 'save') {
			(this.getModel("settings") as JSONModel).getData();
			void SettingsStorageService.save((this.getModel("settings") as JSONModel).getData() as AppSettings);
		} else {
			void SettingsStorageService.getSettings().then((settings: AppSettings) => {
				(this.getModel("settings") as JSONModel).setData(settings);
			})
		}
		(this.settingsDialog as Dialog).close();
	}

	onDelaySelect(oEvent: Event) {
		const index = oEvent.getParameter("selectedIndex");
		switch (index) {
			case 0:
				this.getModel('settings').setProperty('/replayDelay', 0.5);
				break;
			case 1:
				this.getModel('settings').setProperty('/replayDelay', 1.0);
				break;
			case 2:
				this.getModel('settings').setProperty('/replayDelay', 2.0);
				break;
			default:
				this.getModel('settings').setProperty('/replayDelay', 0.5);
		}
	}

	onFrameworkSelect(oEvent: Event) {
		const index = oEvent.getParameter("selectedIndex");
		switch (index) {
			case 0:
				this.getModel('settings').setProperty('/codeStyle', CodeStyles.OPA5);
				break;
			case 1:
				this.getModel('settings').setProperty('/codeStyle', CodeStyles.WDI5);
				break;
			default:
				this.getModel('settings').setProperty('/codeStyle', CodeStyles.OPA5);
		}
	}

	onThemeSelect(oEvent: Event) {
		const index = oEvent.getParameter("selectedIndex");
		switch (index) {
			case 1:
				this.getModel('settings').setProperty('/theme', Themes.EVENING_HORIZON);
				break;
			case 2:
				this.getModel('settings').setProperty('/theme', Themes.QUARTZ_LIGHT);
				break;
			case 3:
				this.getModel('settings').setProperty('/theme', Themes.QUARTZ_DARK);
				break;
			default:
				this.getModel('settings').setProperty('/theme', Themes.MORNING_HORIZON);
		}
		Theming.setTheme((this.getModel('settings').getProperty('/theme')));
	}

	compareProps(args: unknown[]) {
		return args[0] === args[1];
	}

	private _setupNavButtonVisibility() {
		const router: Router = this.getRouter() as Router;
		const model: JSONModel = this.getModel() as JSONModel;
		router.getRoute("main").attachPatternMatched(() => model.setProperty("/showNavButton", false));
		router.getRoute("journey").attachPatternMatched(() => model.setProperty("/showNavButton", true));
		router.getRoute("step").attachPatternMatched(() => model.setProperty("/showNavButton", true));
	}
}
