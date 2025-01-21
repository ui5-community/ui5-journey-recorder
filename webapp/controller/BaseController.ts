import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import History from "sap/ui/core/routing/History";
import UI5Element from "sap/ui/core/Element";
import Dialog from "sap/m/Dialog";
import Fragment from "sap/ui/core/Fragment";
import Event from "sap/ui/base/Event";
import JSONModel from "sap/ui/model/json/JSONModel";
import SettingsStorageService, { AppSettings } from "../service/SettingsStorage.service";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import { ConnectionStatus } from "../model/enum/ConnectionStatus";
import { IconColor, ValueState } from "sap/ui/core/library";
import { ButtonType, DialogType } from "sap/m/library";
import Button from "sap/m/Button";
import Text from "sap/m/Text";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import { ChromeExtensionService } from "../service/ChromeExtension.service";
import MessageToast from "sap/m/MessageToast";
import XMLView from "sap/ui/core/mvc/XMLView";

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default abstract class BaseController extends Controller {
	protected settingsDialog: UI5Element;
	protected _unsafeDialog: Dialog;

	private _dialogs: Record<string, {
		dialog: Dialog,
		view: XMLView,
		controller: Controller & { settings?: { initialHeight?: string, initialWidth?: string } }
	}>;

	private _fragments: Record<string, Dialog>;

	/**
	 * Convenience method for accessing the component of the controller's view.
	 * @returns The component of the controller's view
	 */
	public getOwnerComponent(): AppComponent {
		return super.getOwnerComponent() as AppComponent;
	}

	/**
	 * Convenience method to get the components' router instance.
	 * @returns The router instance
	 */
	public getRouter(): Router {
		return UIComponent.getRouterFor(this);
	}

	/**
	 * Convenience method for getting the i18n resource bundle of the component.
	 * @returns The i18n resource bundle of the component
	 */
	public getResourceBundle(): ResourceBundle | Promise<ResourceBundle> {
		const oModel = this.getOwnerComponent().getModel("i18n") as ResourceModel;
		return oModel.getResourceBundle();
	}

	/**
	 * Convenience method for getting the view model by name in every controller of the application.
	 * @param [sName] The model name
	 * @returns The model instance
	 */
	public getModel(sName?: string): Model {
		return this.getView().getModel(sName);
	}

	/**
	 * Convenience method for setting the view model in every controller of the application.
	 * @param oModel The model instance
	 * @param [sName] The model name
	 * @returns The current base controller instance
	 */
	public setModel(oModel: Model, sName?: string): BaseController {
		this.getView().setModel(oModel, sName);
		return this;
	}

	/**
	 * Convenience method for triggering the navigation to a specific target.
	 * @public
	 * @param sName Target name
	 * @param [oParameters] Navigation parameters
	 * @param [bReplace] Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
	 */
	public navTo(sName: string, oParameters?: object, bReplace?: boolean): void {
		this.getRouter().navTo(sName, oParameters, undefined, bReplace);
	}

	/**
	 * Convenience event handler for navigating back.
	 * It there is a history entry we go one step back in the browser history
	 * If not, it will replace the current entry of the browser history with the main route.
	 */
	public onNavBack(): void {
		const sPreviousHash = History.getInstance().getPreviousHash();
		if (sPreviousHash !== undefined) {
			window.history.go(-1);
		} else {
			this.getRouter().navTo("main", {}, undefined, true);
		}
	}

	async onOpenSettingsDialog() {
		await this.openDialog("Settings");
	}

	setConnecting() {
		(this.getModel() as JSONModel).setProperty('/connectionStatus', ConnectionStatus.CONNECTING);
	}

	setConnected() {
		(this.getModel() as JSONModel).setProperty('/connectionStatus', ConnectionStatus.CONNECTED);
	}

	setDisconnected() {
		(this.getModel() as JSONModel).setProperty('/connectionStatus', ConnectionStatus.DISCONNECTED);
	}

	connectionIcon(connectionStatus: ConnectionStatus) {
		switch (connectionStatus) {
			case ConnectionStatus.CONNECTED:
				return 'sap-icon://connected';
			case ConnectionStatus.DISCONNECTED:
				return 'sap-icon://disconnected';
			case ConnectionStatus.CONNECTING:
				return 'sap-icon://along-stacked-chart';
			default:
				return '';
		}
	}

	connectionColor(connectionStatus: ConnectionStatus) {
		switch (connectionStatus) {
			case ConnectionStatus.CONNECTED:
				return IconColor.Positive;
			case ConnectionStatus.DISCONNECTED:
				return IconColor.Negative;
			case ConnectionStatus.CONNECTING:
				return IconColor.Neutral;
			default:
				return IconColor.Default;
		}
	}

	protected _openUnsafedDialog(callbacks: { success?: () => void | Promise<void>; error?: () => void | Promise<void> }) {
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
						if (callbacks.success) {
							void callbacks.success();
						}
						this._unsafeDialog.close();
					}
				}),
				endButton: new Button({
					text: 'Cancel',
					press: () => {
						if (callbacks.error) {
							void callbacks.error();
						}
						this._unsafeDialog.close();
					}
				})
			})
		}
		this._unsafeDialog.open();
	}

	protected async onConnect(url: string) {
		BusyIndicator.show();
		this.setConnecting();
		await ChromeExtensionService.getInstance().reconnectToPage(url);
		BusyIndicator.hide();
		this.setConnected();
		MessageToast.show('Connected', { duration: 500 });
	}

	protected async onDisconnect() {
		try {
			await ChromeExtensionService.getInstance().disconnect();
			this.setDisconnected();
			MessageToast.show('Disconnected', { duration: 500 });
		} catch (e) {
			console.error(e);
			this.setDisconnected();
			ChromeExtensionService.getInstance().setCurrentTab();
			MessageToast.show('Disconnected', { duration: 500 });
		}
	}

	protected openDialog(sDialogName: string, oData?: Record<string, unknown>): Promise<Record<string, unknown> | void> {
		if (!this._dialogs) {
			this._dialogs = {};
		}

		return new Promise(async (resolve, reject) => {
			if (!this._dialogs[sDialogName]) {
				const oDialog = new Dialog({
					showHeader: false
				});
				this.getView().addDependent(oDialog);
				const oView = await this.getOwnerComponent().runAsOwner(async () => {
					return await XMLView.create({
						viewName: `com.ui5.journeyrecorder.view.dialogs.${sDialogName}`
					});
				});
				const oController = oView.getController();
				oDialog.addContent(oView);

				this._dialogs[sDialogName] = {
					dialog: oDialog,
					view: oView,
					controller: oController
				}
			}
			const oDialogCompound = this._dialogs[sDialogName];
			if (oData) {
				oDialogCompound.view.setModel(new JSONModel(oData), "importData");
			}

			if (oDialogCompound.controller.settings.initialHeight) {
				oDialogCompound.dialog.setContentHeight(oDialogCompound.controller.settings.initialHeight);
			}

			if (oDialogCompound.controller.settings.initialWidth) {
				oDialogCompound.dialog.setContentWidth(oDialogCompound.controller.settings.initialWidth);
			}

			const beforeClose = (oEvent: Event) => {
				oDialogCompound.dialog.detachBeforeClose(beforeClose);
				const pars = oEvent.getParameters() as Record<string, unknown>;
				oDialogCompound.dialog.close();

				if (pars.status === "Success") {
					if (pars.data) {
						resolve(pars.data as Record<string, unknown>);
					} else {
						resolve();
					}
				} else {
					reject();
				}
			};

			oDialogCompound.dialog.attachBeforeClose(beforeClose);

			oDialogCompound.dialog.open();
		})
	}

	protected async openFragment(sFragmentName: string, sFragmentId?: string): Promise<void> {
		if (!sFragmentName) {
			throw new Error("At least the Fragment-Name is needed!");
		}

		if (!this._fragments) {
			this._fragments = {};
		}

		if (!this._fragments[sFragmentName]) {
			const oFragmentDialog = await Fragment.load({
				id: sFragmentId || `${sFragmentName}_id`,
				name: `com.ui5.journeyrecorder.view.dialogs.${sFragmentName}`,
				controller: this
			})
			this.getView().addDependent(oFragmentDialog as UI5Element);
		}

		this._fragments[sFragmentName].open();
	}
}
