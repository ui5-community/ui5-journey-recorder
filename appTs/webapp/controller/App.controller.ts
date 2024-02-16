import BaseController from "./BaseController";

/**
 * @namespace com.ui5.journeyrecorder.controller
 */
export default class App extends BaseController {
	public onInit(): void {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	}

	/* public onAfterRendering(): void {
		// we have to set the content to a fix height, calculated as below
		// because we use the app-view as 
		const element = document.querySelector('div.app-root > section');
		if (element) {
			(element as HTMLElement).style.height = "calc(100% - 5.5rem)";
		}
	} */
}
