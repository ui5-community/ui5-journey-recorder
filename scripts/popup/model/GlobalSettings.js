sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel"
], function (UI5Object, JSONModel) {
    "use strict";

    var GlobalSettings = UI5Object.extend("com.ui5.testing.model.GlobalSettings", {
        /**
         * Constructor
         */
        constructor: function () {
            var oJSON = {
                settings: {},
                settingsDefault: {
                    defaultReplayInterval: 0,
                    defaultReplayTimeout: 5,
                    defaultLanguage: "TCF_B",
                    defaultNatLanguage: "EN",
                    defaultAuthentification: "NONE"
                },
                authentification: [{
                    key: "NONE",
                    text: "None"
                }, {
                    key: "FIORI",
                    text: "Fiori Launchpad"
                }],
                codeLanguages: [{
                    key: "UI5",
                    text: "UIVeri5"
                },
                {
                    key: "TCF_B",
                    text: "Testcafe (Builder)"
                },
                {
                    key: "TCF",
                    text: "Testcafe (JSON)"
                },
                {
                    key: "OPA",
                    text: "OPA5"
                }
                    /*,
                                        {
                                            key: "NAT",
                                            text: "Natural (Experimental)"
                                        }*/
                ],
                naturalLanguages: [{
                    key: "EN",
                    text: "English"
                },
                {
                    key: "DE",
                    text: "German"
                }
                ],
                replayModes: [
                    {
                        key: 0,
                        mode: "Manual"
                    },
                    {
                        key: 4,
                        mode: "Slow (2 sec.)"
                    },
                    {
                        key: 2,
                        mode: "Medium (1 sec.)"
                    },
                    {
                        key: 1,
                        mode: "Fast (0.5 sec.)"
                    }
                ],
                replayTimeouts: [
                    {
                        key: 0,
                        mode: "None (not recommended)"
                    },
                    {
                        key: 2,
                        mode: "Short (2 sec.)"
                    },
                    {
                        key: 5,
                        mode: "Medium (5 sec.)"
                    },
                    {
                        key: 10,
                        mode: "Long (10 sec.)"
                    }
                ]
            };
            this._oModel = new JSONModel(oJSON);
            this.load();
        }
    });

    GlobalSettings.prototype.getModel = function () {
        return this._oModel;
    };

    GlobalSettings.prototype.load = function () {
        chrome.storage.local.get(["settings"], function (data) {
            // load default values
            this._oModel.setProperty("/settings", JSON.parse(JSON.stringify(this._oModel.getProperty("/settingsDefault"))));
            // override default values with stored and retrieved values
            if (data && data.settings) {
                for (var key in data.settings) {
                    this._oModel.setProperty("/settings/" + key, data.settings[key]);
                }
            }
        }.bind(this));
    };

    GlobalSettings.prototype.save = function () {
        var oData = this._oModel.getProperty("/settings");
        chrome.storage.local.set({
            "settings": oData
        }, function (data) { });
    };

    return new GlobalSettings();
});
