sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/demo/todo/model/formatter"
], function (Controller, formatter) {
	"use strict";

	return Controller.extend("sap.ui.demo.todo.controller.BaseController", {
		formatter: formatter,

		priorSlide: function () {
			if (!this._slideSequence) {
				this._slideSequence = this.getOwnerComponent().getModel().getProperty('/slideSequence');
			}
			var curNum = this.getView().getModel().getProperty('/siteNum');
			if (curNum != 0) {
				curNum = curNum - 1;
			}
			this.getView().getModel().setProperty('/siteNum', curNum);

			if (this._slideSequence[curNum] === "page4") {
				this.getOwnerComponent().getRouter().navTo(this._slideSequence[curNum], {postId: 'PostID_0'});
			} else {
				this.getOwnerComponent().getRouter().navTo(this._slideSequence[curNum]);
			}
		},
		nextSlide: function (oParameter) {
			if (!this._slideSequence) {
				this._slideSequence = this.getOwnerComponent().getModel().getProperty('/slideSequence');
			}
			var curNum = this.getView().getModel().getProperty('/siteNum');
			if ((curNum + 1) < this._slideSequence.length) {
				curNum = curNum + 1;
			}
			this.getView().getModel().setProperty('/siteNum', curNum);
			if (!oParameter || oParameter.sId === "press") {
				oParameter = {postId: 'PostID_0'};
			}
			this.getOwnerComponent().getRouter().navTo(this._slideSequence[curNum], oParameter);
		},

		setSlideNumber: function (sRouteName) {
			if (!this._slideSequence) {
				this._slideSequence = this.getOwnerComponent().getModel().getProperty('/slideSequence');
			}
			var index = this._slideSequence.indexOf(sRouteName);
			if (index === -1) {
				index = 0;
				this.getView().getModel().setProperty('/siteNum', index);
				this.getOwnerComponent().getRouter().navTo(this._slideSequence[index])
			} else {
				this.getView().getModel().setProperty('/siteNum', index);
			}
		},

		registerKeyCodes: function () {
			$(document).keydown(function (oEvt) {
				switch (oEvt.keyCode) {
					case 39: // 'ArrowRight'
						oEvt.preventDefault();
						this.nextSlide();
						break;
					case 37: //'ArrowLeft'
						oEvt.preventDefault();
						this.priorSlide()
						break;
					default:
				}
			}.bind(this));
		}
	});
});
