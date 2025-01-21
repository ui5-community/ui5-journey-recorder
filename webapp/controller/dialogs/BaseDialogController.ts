import Event from "sap/ui/base/Event";
import BaseController from "../BaseController";
import Dialog from "sap/m/Dialog";

/**
 * @namespace com.ui5.journeyrecorder.controller.dialogs
 */
export default class BaseDialogController extends BaseController {
    closeBySuccess(oPressEvent: Event, data?: Record<string, unknown>) {
        const oResult: {
            origin: unknown,
            result: "Confirm" | "Abort",
            data?: Record<string, unknown>
        } = {
            origin: oPressEvent.getSource(),
            result: "Confirm",
        };
        if (data) {
            oResult.data = data;
        }
        (this.getView().getParent() as Dialog).fireBeforeClose(oResult)
    }

    closeByAbort(oPressEvent: Event) {
        (this.getView().getParent() as Dialog).fireBeforeClose({
            origin: oPressEvent.getSource(),
            result: "Abort"
        })
    }
}