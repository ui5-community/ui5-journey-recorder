sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History'
], function (Controller, History) {
    'use strict';

    return Controller.extend('com.ui5.testing.controller.BaseController', {
        _oResourceBundle: null,

        onInit: function () {
            this._oResourceBundle = this.getResourceBundle();
        },

        getRouter: function() {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function(sName) {
            return this.getView().getModel(sName);
        },

        setModel: function(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function() {
            return this.getOwnerComponent().getModel('i18n').getResourceBundle();
        },

        getMessageManager: function() {
            return sap.ui.getCore().getMessageManager();
        },

        onNavBack: function(oEvent) {
            history.go(-1);
        },

        _setBusy: function (bBusy, sModelName) {
            return new Promise(function(resolve) {
                this._setBusyIndicatorImmediate(bBusy, sModelName);
                resolve();
            }.bind(this));
        },

        _setBusyIndicatorImmediate: function (bBusy, sModelName) {
            var oViewModel = this.getModel(sModelName ? sModelName : "viewModel");
            var sBusy = "/busy";
            var sDelay = "/delay";
            if (bBusy === true) {
                oViewModel.setProperty(sBusy, true);
                oViewModel.setProperty(sDelay, 0);
            } else {
                oViewModel.setProperty(sBusy, false);
                oViewModel.setProperty(sDelay, this._iBusyIndicatorDelay);
            }
        }
    });
});