import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import JourneyStorageService from "../service/JourneyStorage.service";
import Journey from "../model/class/Journey.class";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Dialog from "sap/m/Dialog";
import Text from "sap/m/Text";
import { ButtonType, DialogType } from "sap/m/library";
import MessageToast from "sap/m/MessageToast";
import Button from "sap/m/Button";
import { ChromeExtensionService } from "../service/ChromeExtension.service";
import UI5Element from "sap/ui/core/Element";
import Event from "sap/ui/base/Event";
import List from "sap/m/List";
import SearchField from "sap/m/SearchField";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class Main extends BaseController {
	private _approveUploadDialog: Dialog;
	private _removeJourneyDialog: Dialog;
	private _timerIndex: number;
	onInit() {
		const model = new JSONModel({});
		this.setModel(model, 'main');
		this.getRouter().getRoute("main").attachPatternMatched(() => {
			this._loadTabs();
			//the periodic load
			this._timerIndex = setInterval(this._loadTabs.bind(this), 5000);
		}, this);
		this.getRouter().getRoute("main").attachPatternMatched(this._loadJourneys, this);
		this.getView().addEventDelegate({
			onBeforeHide: () => {
				clearInterval(this._timerIndex);
			}
		}, this)
	}

	onUploadJourney() {
		BusyIndicator.show();
		const input: HTMLInputElement = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.addEventListener('change', ($event: Event) => {
			const files = ($event.currentTarget as HTMLInputElement).files;
			const reader = new FileReader();
			reader.onload = (input) => {
				const content = input.target?.result as string;
				if (content) {
					void this._importFinished(content);
				}
			};
			if (files) {
				reader.readAsText(files[0]);
			}
		});
		input.click();
		input.remove();
	}

	onSearch(oEvent: sap.ui.base.Event): void {
		// add filter for search
		const aFilters = [];
		const sourceId: string = (oEvent.getSource() as SearchField).getId();
		const sQuery = (oEvent.getSource() as SearchField).getValue();
		let oList: List;

		if (sourceId.indexOf('-tabs') > -1) {
			oList = this.byId("tabsList");
			if (sQuery && sQuery.length > 0) {
				const filter = new Filter("title", FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
		} else {
			oList = this.byId("journeysList");
			if (sQuery && sQuery.length > 0) {
				const filter = new Filter("name", FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
		}
		// update list binding
		const oBinding = oList.getBinding("items");
		oBinding.filter(aFilters);
	}

	navigateToJourney($event: sap.ui.base.Event) {
		const source: UI5Element = $event.getSource();
		const bindingCtx = source.getBindingContext('main');
		const id: string = bindingCtx.getProperty('id') as string;

		this.getRouter().navTo('journey', { id: id });
	}

	private _loadTabs(): void {
		//the initial load
		void ChromeExtensionService.getAllTabs().then((aTabs) => {
			(this.getModel('main') as JSONModel).setProperty("/tabs", aTabs);
		});
	}

	private _loadJourneys(): void {
		void JourneyStorageService.getInstance().getAll().then((journeys: Journey[]) => {
			(this.getModel('main') as JSONModel).setProperty("/journeys", journeys);
		});
	}

	private async _importFinished(jsonString: string): Promise<void> {
		const jour = Journey.fromJSON(jsonString);
		const exists = await JourneyStorageService.getInstance().getById(jour.id);
		if (exists) {
			BusyIndicator.hide();
			if (!this._approveUploadDialog) {
				this._approveUploadDialog = new Dialog({
					type: DialogType.Message,
					title: 'Journey already exists!',
					content: new Text({ text: "A journey with the same id already exists, override?" }),
					beginButton: new Button({
						type: ButtonType.Critical,
						text: "Override!",
						press: () => {
							BusyIndicator.show();
							void JourneyStorageService.getInstance().save(jour).then(() => {
								BusyIndicator.hide();
								this._approveUploadDialog.close()
								MessageToast.show('Journey imported!');
								this._loadJourneys();
							});
						}
					}),
					endButton: new Button({
						text: "Cancel",
						press: () => {
							this._approveUploadDialog.close()
						}
					})
				});
			}
			this._approveUploadDialog.open();
		} else {
			await JourneyStorageService.getInstance().save(jour);
			BusyIndicator.hide();
			MessageToast.show('Journey imported!');
			this._loadJourneys();
		}
	}
	async removeJourney($event: sap.ui.base.Event): Promise<void> {
		const source: UI5Element = $event.getSource();
		const bindingCtx = source.getBindingContext('main');
		const jour = await JourneyStorageService.getInstance().getById(bindingCtx.getProperty('id') as string);
		if (!this._removeJourneyDialog) {
			this._removeJourneyDialog = new Dialog({
				type: DialogType.Message,
				title: 'Delete Journey!',
				content: new Text({ text: `Do you really want to delete the journey "${bindingCtx.getProperty('name')}"?` }),
				beginButton: new Button({
					type: ButtonType.Critical,
					text: "Delete!",
					press: () => {
						BusyIndicator.show();
						void JourneyStorageService.getInstance().deleteJourney(jour).then(() => {
							BusyIndicator.hide();
							this._removeJourneyDialog.close()
							MessageToast.show('Journey removed!');
							this._loadJourneys();
						});
					}
				}),
				endButton: new Button({
					text: "Cancel",
					press: () => {
						this._removeJourneyDialog.close()
					}
				})
			});
		}
		this._removeJourneyDialog.open();
	}
}