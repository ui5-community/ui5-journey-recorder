import BaseDialogController from "./BaseDialogController";
import { Themes } from "../../model/enum/Themes";
import Theming from "sap/ui/core/Theming";
import JSONModel from "sap/ui/model/json/JSONModel";
import SettingsStorageService, { AppSettings } from "../../service/SettingsStorage.service";
import ListItem from "sap/ui/core/ListItem";
import Event from "sap/ui/base/Event";
import Dialog from "sap/m/Dialog";

/**
 * @namespace com.ui5.journeyrecorder.controller.dialogs
 */
export default class Settings extends BaseDialogController {
    settings = {
        initialHeight: '91vh',
        initialWidth: '30rem'
    }

    onThemeSelect(oEvent: Event) {
        const oItem = oEvent.getParameter("selectedItem" as never) as ListItem;
        const oModel = this.getModel("settings") as JSONModel;
        oModel.setProperty('/theme', oItem.getKey());
        Theming.setTheme(oItem.getKey());
    }

    onCloseDialog(oEvent: Event, bSave: boolean) {
        if (bSave) {
            void SettingsStorageService.save((this.getModel("settings") as JSONModel).getData() as AppSettings);
        }
        (this.getView().getParent() as Dialog).fireBeforeClose({
            origin: oEvent.getSource(),
            result: bSave ? 'Confirm' : 'Reject'
        });
    }
}