sap.ui.define([
    "sap/ui/base/Object"
], function (UI5Object) {
    "use strict";

    var Messaging = UI5Object.extend("com.ui5.testing.model.Communication", {
        _aEvents: {},
        _oUUIDs: {},
        _sTabId: "",
        _bStartImmediate: false,
        _initPromise: null,
        constructor: function () {
            var that = this;
            this._oWindowId = null;
            this._initPromise = new Promise(function (resolve, reject) {
                chrome.runtime.onMessage.addListener(
                    function (request, sender, sendResponse) {
                        if (request && request.type === "send-window-id") {
                            that._oWindowId = request.windowid;
                            that._bStartImmediate = request.startImmediate;
                            resolve();
                        }
                    }.bind(this)
                );
                chrome.runtime.sendMessage({ type: "HandshakeToWindow" }, function (response) {
                    //ask to get our window id
                }.bind(this));
            }.bind(this))
        }
    });

    Messaging.prototype.isInitialized = function () {
        return this._initPromise;
    };

    Messaging.prototype.isStartImmediate = function () {
        return this._bStartImmediate;
    };

    Messaging.prototype.setStartImmediate = function (bImmediate) {
        this._bStartImmediate = bImmediate;
    };

    Messaging.prototype.getOwnWindowId = function () {
        return this._oWindowId;
    };

    Messaging.prototype.register = function (sTabId) {
        this._sTabId = sTabId;
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                this.fireEventToExtension(request);
                sendResponse({ ok: true });
            }.bind(this));
    };

    Messaging.prototype.fireEventToExtension = function (oEvent) {
        var sEventType = oEvent.type;
        var oResponse = {};
        if (sEventType === "answer-async") {
            this._handleAsyncAnswer(oEvent.data);
            return;
        }

        if (this._aEvents[sEventType]) {
            for (var i = 0; i < this._aEvents[sEventType].length; i++) {
                this._aEvents[sEventType][i](oEvent.data);
            }
        }
    };

    Messaging.prototype._handleAsyncAnswer = function (oData) {
        if (!this._oUUIDs[oData.uuid]) {
            return;
        }
        this._oUUIDs[oData.uuid].resolveFn(oData.data);
    };

    Messaging.prototype.registerEvent = function (sEvent, fnListener) {
        if (typeof this._aEvents[sEvent] === "undefined") {
            this._aEvents[sEvent] = [];
        }
        this._aEvents[sEvent].push(fnListener);
    };

    Messaging.prototype.fireEvent = function (sType, oData) {
        //forewarding from injection to extension..
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        return new Promise(function (resolve) {
            var oEvent = {
                type: sType,
                data: oData,
                uuid: uuidv4()
            };
            this._oUUIDs[oEvent.uuid] = {};
            this._oUUIDs[oEvent.uuid].resolveFn = resolve;

            chrome.tabs.sendMessage(this._sTabId, oEvent, function (response) {
                oEvent = oEvent;
                if (response && response.data && response.data.asyncAnswer === true) {
                    return; //answer will follow, but async..
                }
                if (!response) {
                    return;
                }

                if (response && response.data) {
                    this._oUUIDs[response.uuid].resolveFn(response.data);
                } else {
                    this._oUUIDs[response.uuid].resolveFn();
                }
            }.bind(this));
        }.bind(this));
    };

    return new Messaging();
});