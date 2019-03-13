var TestHandlerSingleton = null;

document.addEventListener('do-ui5-init', function (oXMLEvent) {
    if (TestHandlerSingleton) {
        TestHandlerSingleton.init();
    }
});

var oLastDom = null;
document.addEventListener("mousedown", function (event) {
    if (event.button == 2) {
        oLastDom = event.target;
    }
}, true);

document.addEventListener("do-ui5-from-extension-to-inject", function (oXMLEvent) {
    var uuid = oXMLEvent.detail.uuid;
    if (uuid) {
        delete oXMLEvent.detail.uuid;
    }

    if (oXMLEvent.detail.type === "navigate") {
        //early exit, as TestHandlerSingleton is maybe not even existing.
        if (window.location.href == oXMLEvent.detail.data.target) {
            window.location.reload();
        } else {
            window.location.href = oXMLEvent.detail.data.target;
        }
        return;
    }
    var oReturn = TestHandlerSingleton.handleEvent(oXMLEvent.detail.type, oXMLEvent.detail.data);
    if (!oReturn) {
        oReturn = { processed: true, uuid: uuid };
    } else {
        oReturn.processed = true;
        oReturn.uuid = uuid;
    }

    if (oReturn instanceof Promise) {
        oReturn.then(function (oData) {
            document.dispatchEvent(new CustomEvent('do-ui5-from-inject-to-async', { detail: { type: "answer", uuid: uuid, data: oData } }));
        });
    } else {
        document.dispatchEvent(new CustomEvent('do-ui5-from-inject-to-async', { detail: { type: "answer", uuid: uuid, data: oReturn } }));
    }
});

document.addEventListener('do-ui5-start', function (oXMLEvent) {
    if (oXMLEvent.detail && oXMLEvent.detail.domId) {
        TestHandlerSingleton.startFor(oXMLEvent.detail.domId);
    } else {
        TestHandlerSingleton._start();
    }
});

var oTestGlobalBuffer = {
    fnGetElement: {
        true: {},
        false: {}
    },
    findItem: {},
    fnGetElementInfo: {
        true: {},
        false: {}
    },
    label: null
};

//super shitty code - we are just architectuarlly not designed correctly here..
if (typeof sap === "undefined" || typeof sap.ui === "undefined" || typeof sap.ui.getCore === "undefined" || !sap.ui.getCore() || !sap.ui.getCore().isInitialized()) {
    document.dispatchEvent(new CustomEvent('do-ui5-ok', { detail: { ok: false, version: "none" } }));
}
else {
    document.dispatchEvent(new CustomEvent('do-ui5-ok', { detail: { ok: true, version: sap.ui.version } }));

    //woaah: that is shitty - but it is difficult to inject a lot of pages and make best practice coding here.. for personal use okee..
    var BaseObject = sap.ui.require("sap/ui/base/Object");
    var JSONModel = sap.ui.require("sap/ui/model/json/JSONModel");
    var MessageToast = sap.ui.require("sap/m/MessageToast");
    var ValueState = sap.ui.require("sap/ui/core/ValueState");
    var TestHandler = BaseObject.extend("com.tru.TestHandler", {
        _oDialog: null,
        _oPopoverAction: null,
        _bDialogActive: false,
        _oModel: new JSONModel({
            element: {
                property: {}, //properties
                item: {}, //current item itself,
                attributeFilter: [], //table entries of selectors
                assertFilter: [], //table entries of asserts,
                messages: []
            },
            elements: [],
            dynamic: {
                attrType: []
            },
            statics: {
                supportRules: []
            },
            ratingOfAttributes: 3,
            isStretched: false,
            codes: [],
            idQualityState: ValueState.None,
            idQualityStateText: "",
            codeLines: [] //currently maintained code-lines
        }),
        _bActive: false,
        _bScreenLocked: false,
        _bStarted: false,
        constructor: function () {
            this._getCriteriaTypes();
        }
    });

    TestHandler.prototype.lockScreen = function () {
        this._bScreenLocked = true;
    };
    TestHandler.prototype.unlockScreen = function () {
        this._bScreenLocked = false;
    };

    TestHandler.prototype._doReplaySteps = function () {
        //go over all steps 
    };

    TestHandler.prototype._getDataModelInformation = function () {
        return new Promise(function (resolve, reject) {
            var oCoreObject = null;
            var fakePlugin = {
                startPlugin: function (core) {
                    oCoreObject = core;
                    return core;
                }
            };
            sap.ui.getCore().registerPlugin(fakePlugin);
            sap.ui.getCore().unregisterPlugin(fakePlugin);

            var oReturn = {};
            for (var sComponent in oCoreObject.mObjects.component) {
                var oComponent = oCoreObject.mObjects.component[sComponent];
                var oManifest = oComponent.getManifest();
                if (oManifest && oManifest["sap.app"]) {
                    var oApp = oManifest["sap.app"];
                    var oUI5 = oManifest["sap.ui5"];
                    var sComponentName = oApp.id ? oApp.id : oManifest.name;
                    oReturn[sComponentName] = {
                        manifest: {
                            models: oUI5.models,
                            dataSources: oApp.dataSources
                        },
                        services: []
                    };

                    if (oUI5.models) {
                        for (var sModel in oUI5.models) {
                            var oModel = oUI5.models[sModel];
                            if (!oApp.dataSources || !oApp.dataSources[oModel.dataSource] || oApp.dataSources[oModel.dataSource].type !== "OData") {
                                continue;
                            }
                            var oDataSource = oApp.dataSources[oModel.dataSource];
                            var oModelReturn = {
                                serviceUrl: oComponent.getModel(sModel === "" ? undefined : sModel).sServiceUrl
                            };

                            //attention: in case  oModel.settings.dataSource.uri is absolute (which is ok), than this is our path
                            var r = new RegExp('^(?:[a-z]+:)?//', 'i');
                            if (r.test(oModelReturn.serviceUrl) === true) {
                                oModelReturn.serviceUrl = oDataSource.uri;
                            } else {
                                oModelReturn.serviceUrl = location.protocol + "//" + location.hostname + (location.port.length ? ":" : "") + location.port + (oModelReturn.serviceUrl.charAt(0) === "/" ? "" : "/") + oModelReturn.serviceUrl;
                            }
                            oModelReturn.outdir = "webapp/localService/" + oModel.dataSource;
                            oModelReturn.title = oModel.dataSource;
                            oModelReturn.componentName = sComponentName;
                            oModelReturn.modulePath = sComponentName.replace(/\./g, "/");
                            oReturn[sComponentName].services.push(oModelReturn);
                        }
                    }
                }
            }
            resolve(oReturn);

        }.bind(this));
    };

    TestHandler.prototype.handleEvent = function (sEventType, oEventData) {
        if (sEventType === "start") {
            this._start(oEventData);
        } else if (sEventType === "stop") {
            this._stop();
        } else if (sEventType === "unlock") {
            this.unlockScreen();
        } else if (sEventType === "find") {
            return this._getFoundElements(oEventData);
        } else if (sEventType === "mockserver") {
            return this._getDataModelInformation();
        } else if (sEventType === "replay-steps") {
            return this._doReplaySteps(oEventData);
        } else if (sEventType === "execute") {
            this._executeAction(oEventData);
        } else if (sEventType === "setWindowLocation") {
            this._setWindowLocation(oEventData);
        } else if (sEventType === "selectItem") {
            this._selectItem(oEventData);
        } else if (sEventType === "runSupportAsssistant") {
            return this._runSupportAssistant(oEventData);
        } else if (sEventType === "getwindowinfo") {
            return this._getWindowInfo();
        }
    };

    TestHandler.prototype._setWindowLocation = function (oEventData) {
        window.location.href = oEventData.url;
    };

    TestHandler.prototype._selectItem = function (oEventData) {
        var oCtrl = sap.ui.getCore().byId(oEventData.element);
        if (!oCtrl) {
            return;
        }
        this.onClick(oCtrl.getDomRef());
    };

    TestHandler.prototype._getWindowInfo = function () {
        return {
            title: document.title,
            url: window.location.href,
            hash: window.location.hash,
            ui5Version: sap.ui.version
        };
    };

    TestHandler.prototype.fireEventToContent = function (sEventType, oEventData) {
        document.dispatchEvent(new CustomEvent('do-ui5-from-inject-to-extension', { detail: { type: sEventType, data: oEventData } }));
    };

    TestHandler.prototype._getControlFromDom = function (oDomNode) {
        var oControls = jQuery(document.getElementById(oDomNode.id)).control();
        if (!oControls || !oControls.length) {
            return null;
        }
        return oControls[0];
    };

    TestHandler.prototype._getFinalDomNode = function (oElement) {
        var sExtension = oElement.property.domChildWith;
        if (!sExtension.length) {
            return $(sap.ui.getCore().byId(oElement.item.identifier.ui5AbsoluteId).getDomRef());
        }

        return $("*[id$='" + (oElement.item.identifier.ui5AbsoluteId + sExtension) + "']");
    };

    TestHandler.prototype._executeAction = function (oEventData) {
        this.unlockScreen();

        var oItem = oEventData.element;
        var oDom = this._getFinalDomNode(oItem);

        $(oDom).addClass("HVRReveal");
        setTimeout(function () {
            $(oDom).removeClass("HVRReveal");
        }, 500);

        if (oItem.property.actKey === "PRS") {
            //send touch event..
            var event = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            event.originalEvent = event; //self refer
            oDom.get(0).dispatchEvent(event);

            var event = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            event.originalEvent = event; //self refer
            oDom.get(0).dispatchEvent(event);

            var event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            event.originalEvent = event; //self refer
            oDom.get(0).dispatchEvent(event);
        } else if (oItem.property.actKey === "TYP") {
            var sText = oItem.property.selectActInsert;
            oDom.focus();
            if (sText.length > 0 && oItem.property.actionSettings.replaceText === false) {
                oDom.val(oDom.val() + sText);
            } else {
                oDom.val(sText);
            }

            //first simulate a dummy input (NO! ENTER! - that is different)
            //this will e.g. trigger the liveChange evnts
            var event = new KeyboardEvent('input', {
                view: window,
                data: '',
                bubbles: true,
                cancelable: true
            });
            event.originalEvent = event;
            oDom.get(0).dispatchEvent(event);

            //afterwards trigger the blur event, in order to trigger the change event (enter is not really the same.. but ya..)
            if (oItem.property.actionSettings.blur === true ) {
                var event = new MouseEvent('blur', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                event.originalEvent = event;
                oDom.get(0).dispatchEvent(event);
            }
            if ( oItem.property.actionSettings.enter === true ) {
                var event = new KeyboardEvent('keydown', {
                    view: window,
                    data: '',
                    charCode: 0,
                    code: "Enter",
                    key: "Enter",
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                event.originalEvent = event;
                oDom.get(0).dispatchEvent(event);
            }
        }
    };

    TestHandler.prototype._getAllChildrenOfDom = function (oDom, oControl) {
        var aChildren = $(oDom).children();
        var aReturn = [];
        for (var i = 0; i < aChildren.length; i++) {
            var aControl = $(aChildren[i]).control();
            if (aControl.length === 1 && aControl[0].getId() === oControl.getId()) {
                aReturn.push(aChildren[i]);
                aReturn = aReturn.concat(this._getAllChildrenOfDom(aChildren[i], oControl));
            }
        }
        return aReturn;
    };

    TestHandler.prototype._getAllChildrenOfObject = function (oItem) {
        if (!oItem.dom) {
            return [];
        }
        return this._getAllChildrenOfDom(oItem.control.getDomRef(), oItem.control);
    };

    TestHandler.prototype._findItemAndExclude = function (oSelector) {
        var sStringified = JSON.stringify(oSelector);
        var aInformation = [];
        if (!oTestGlobalBuffer["findItem"][sStringified]) {
            oTestGlobalBuffer["findItem"][sStringified] = this._findItem(oSelector);
        }
        aInformation = oTestGlobalBuffer["findItem"][sStringified];

        //remove all items, which are starting with "testDialog"..
        var aReturn = [];
        for (var i = 0; i < aInformation.length; i++) {
            if (aInformation[i].getId().indexOf("testDialog") === -1) {
                aReturn.push(aInformation[i]);
            }
        }

        return aReturn;
    }

    TestHandler.prototype._getFoundElements = function (sString) {
        var aItems = this._findItemAndExclude(sString);
        var aItemsEnhanced = [];
        for (var i = 0; i < aItems.length; i++) {
            var oItem = this._removeNonSerializable(this._getElementInformation(aItems[i], aItems[i].getDomRef(), true));
            aItemsEnhanced.push(oItem);
        }
        return aItemsEnhanced;
    };

    TestHandler.prototype.onShowItemGlobal = function () {
        var oItem = this._oModel.getProperty("/element/item");
        this._showItemControl(oItem.control);
    };

    TestHandler.prototype.onShowItem = function (oEvent) {
        var oObj = oEvent.getSource().getBindingContext("viewModel").getObject();
        if (!oObj.control) {
            return;
        }
        this._showItemControl(oObj.control);
    };

    TestHandler.prototype._showItemControl = function (oControl) {
        var oJQ = $(oControl.getDomRef());
        var oJQDialog = $(this._oDialog.getDomRef());
        var oOldWithControl = $(".HVRReveal");
        oOldWithControl.removeClass("HVRReveal");
        oJQ.addClass("HVRReveal");

        oJQDialog.fadeOut(function () {
            oJQDialog.delay(500).fadeIn(function () {
                oJQ.removeClass("HVRReveal");
                oOldWithControl.addClass("HVRReveal");
            });
        });
    };


    TestHandler.prototype._runSupportAssistant = function (oComponent) {
        return new Promise(function (resolve, reject) {
            var oSupSettings = oComponent.rules;
            var sComponent = oComponent.component;

            sap.ui.require(["sap/ui/support/Bootstrap"], function (Bootstrap) {
                Bootstrap.initSupportRules(["silent"]);
                var aExclude = oSupSettings.supportRules;
                var aListAll = this._oModel.getProperty("/statics/supportRules");
                for (var i = 0; i < aExclude.length; i++) {
                    var sLib = aExclude[i].split("/")[0];
                    var sRuleId = aExclude[i].split("/")[1];
                    for (var j = 0; j < aListAll.length; j++) {
                        if (aListAll[j].libName === sLib &&
                            aListAll[j].ruleId === sRuleId) {
                            aListAll = aListAll.splice(j, 1);
                            break;
                        }
                    }
                }

                setTimeout(function () {
                    jQuery.sap.support.analyze({
                        type: "components",
                        components: [sComponent]
                    }, aListAll.length > 0 ? aListAll : undefined).then(function () {
                        var aIssues = jQuery.sap.support.getLastAnalysisHistory();
                        var aStoreIssue = [];
                        for (var i = 0; i < aIssues.issues.length; i++) {
                            var oIssue = aIssues.issues[i];
                            if (oSupSettings.ignoreGlobal === true && oIssue.context.id === "WEBPAGE") {
                                continue;
                            }
                            var sState = "Error";
                            var iPrio = 3;
                            if (oIssue.severity === "Medium") {
                                sState = "Warning";
                                iPrio = 2;
                            } else if (oIssue.severity === "Low") {
                                sState = "None";
                                iPrio = 1;
                            }
                            aStoreIssue.push({
                                severity: oIssue.severity,
                                details: oIssue.details,
                                context: oIssue.context.id,
                                rule: oIssue.rule.id,
                                ruleText: oIssue.rule.description,
                                state: sState,
                                importance: iPrio
                            });
                        }

                        aStoreIssue = aStoreIssue.sort(function (aObj, bObj) {
                            if (aObj.importance <= bObj.importance) {
                                return 1;
                            }
                            return -1;
                        });
                        var oLoader = sap.ui.require("sap/ui/support/supportRules/RuleSetLoader");
                        var aRules = [];
                        if (oLoader) { //only as of 1.52.. so ignore that for the moment
                            aRules = oLoader.getAllRuleDescriptors();
                        }

                        resolve({
                            results: aStoreIssue,
                            rules: aRules
                        });
                    }.bind(this));
                }.bind(this), 0);
            }.bind(this));
        }.bind(this));
    };

    TestHandler.prototype._getOwnerComponent = function (oItem) {
        var sCurrentComponent = "";
        var oParent = oItem;
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }
        return sCurrentComponent;
    };

    TestHandler.prototype._getUi5LocalId = function (oItem) {
        var sId = oItem.getId();
        if (sId.lastIndexOf("-") !== -1) {
            return sId.substr(sId.lastIndexOf("-") + 1);
        }
        return sId;
    };

    TestHandler.prototype._getUi5Id = function (oItem) {
        //remove all component information from the control
        var oParent = oItem;
        var sCurrentComponent = "";
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }
        if (!sCurrentComponent.length) {
            return oItem.getId();
        }

        var sId = oItem.getId();
        sCurrentComponent = sCurrentComponent + "---";
        if (sId.lastIndexOf(sCurrentComponent) !== -1) {
            return sId.substr(sId.lastIndexOf(sCurrentComponent) + sCurrentComponent.length);
        }
        return sId;
    };


    TestHandler.prototype._getPropertiesInArray = function (oObj) {
        var i = 0;
        for (var sAttr in oObj) {
            if (sAttr.indexOf("_") === 0) {
                continue;
            }
            i += 1;
        }
        return i;
    };

    TestHandler.prototype._setUniqunessInformationElement = function (oItem) {
        var iUniqueness = 0;
        var oMerged = this._getMergedClassArray(oItem);
        oItem.uniquness = {
            property: {},
            context: {},
            binding: {}
        };

        //create uniquness for properties..
        var oObjectProps = {};
        var oObjectCtx = {};
        if (oItem.parent && oItem.parent.control && oItem.control.sParentAggregationName && oItem.control.sParentAggregationName.length > 0) {
            //we are an item..get all children of my current level, to search for identical items..
            var aItems = oItem.parent.control.getAggregation(oItem.control.sParentAggregationName);
            if (!aItems) {
                return oItem;
            }
            for (var i = 0; i < aItems.length; i++) {
                if (aItems[i].getMetadata().getElementName() !== oItem.control.getMetadata().getElementName()) {
                    continue;
                }
                for (var sModel in oItem.context) {
                    if (!oObjectCtx[sModel]) {
                        oObjectCtx[sModel] = {
                        };
                    }
                    var oCtx = aItems[i].getBindingContext(sModel === "undefined" ? undefined : sModel);
                    if (!oCtx) {
                        continue;
                    }
                    var oCtxObject = oCtx.getObject();

                    for (var sCtx in oItem.context[sModel]) {
                        var sValue = null;
                        sValue = oCtxObject[sCtx];
                        if (!oObjectCtx[sModel][sCtx]) {
                            oObjectCtx[sModel][sCtx] = {
                                _totalAmount: 0
                            };
                        }
                        if (!oObjectCtx[sModel][sCtx][sValue]) {
                            oObjectCtx[sModel][sCtx][sValue] = 0;
                        }
                        oObjectCtx[sModel][sCtx][sValue] = oObjectCtx[sModel][sCtx][sValue] + 1;
                        oObjectCtx[sModel][sCtx]._totalAmount = oObjectCtx[sModel][sCtx]._totalAmount + 1;
                    }
                    for (var sCtx in oItem.context[sModel]) {
                        oObjectCtx[sModel][sCtx]._differentValues = this._getPropertiesInArray(oObjectCtx[sModel][sCtx]);
                    }
                }
                for (var sProperty in oItem.property) {
                    var sGetter = "get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1);
                    if (!oObjectProps[sProperty]) {
                        oObjectProps[sProperty] = {
                            _totalAmount: 0
                        };
                    }
                    var sValue = aItems[i][sGetter]();
                    if (!oObjectProps[sProperty][sValue]) {
                        oObjectProps[sProperty][sValue] = 0;
                    }
                    oObjectProps[sProperty][sValue] = oObjectProps[sProperty][sValue] + 1;
                    oObjectProps[sProperty]._totalAmount = oObjectProps[sProperty]._totalAmount + 1;
                }
                for (var sProperty in oItem.property) {
                    oObjectProps[sProperty]._differentValues = this._getPropertiesInArray(oObjectProps[sProperty]);
                }
            }
        }

        for (var sAttr in oItem.property) {
            iUniqueness = 0;
            var oAttrMeta = oItem.control.getMetadata().getProperty(sAttr);
            if (oAttrMeta.defaultValue && oAttrMeta.defaultValue === oItem.property[sAttr]) {
                iUniqueness = 0;
            } else {
                //we know the total amount, and the amount of our own property + the general "diversity" of that column
                //we can use our own property, to identify the uniquness of it
                //+ use the diversity, to check if we are in some kinda "key" field..
                if (oMerged.cloned === true) {
                    if (oObjectProps[sAttr]._totalAmount === oObjectProps[sAttr]._differentValues) {
                        //seems to be a key field.. great
                        iUniqueness = 100;
                    } else {
                        iUniqueness = ((oObjectProps[sAttr]._totalAmount + 1 - oObjectProps[sAttr][oItem.property[sAttr]]) / oObjectProps[sAttr]._totalAmount) * 90;
                    }
                } else {
                    //binding is certainly very good - increase
                    if (oMerged.preferredProperties.indexOf(sAttr) !== -1) {
                        iUniqueness = 100;
                    } else if (oItem.binding[sAttr]) { //binding exists.. make it a little better...
                        iUniqueness = 50;
                    } else {
                        iUniqueness = 0;
                    }
                }
            }
            oItem.uniquness.property[sAttr] = parseInt(iUniqueness, 10);
        }

        for (var sAttr in oItem.binding) {
            iUniqueness = 0;
            if (oMerged.cloned === true) {
                //we are > 0 - our uniquness is 0, as bindings as MOST CERTAINLY not done per item (but globally)
                iUniqueness = 0;
            } else {
                //check if the binding is a preferred one (e.g. for label and similar)
                iUniqueness = oItem.uniquness.property[sAttr];
                if (oMerged.preferredProperties.indexOf(sAttr) !== -1) {
                    //binding is certainly very good - increase
                    iUniqueness = 100;
                }
            }
            oItem.uniquness.binding[sAttr] = parseInt(iUniqueness, 10);
        }

        for (var sModel in oItem.context) {
            oItem.uniquness.context[sModel] = {};
            for (var sAttr in oItem.context[sModel]) {
                if (oMerged.cloned === true) {
                    if (oObjectCtx[sModel][sAttr]._totalAmount === oObjectCtx[sModel][sAttr]._differentValues) {
                        iUniqueness = 100;
                    } else {
                        iUniqueness = ((oObjectCtx[sModel][sAttr]._totalAmount + 1 - oObjectCtx[sModel][sAttr][oItem.context[sModel][sAttr]]) / oObjectCtx[sModel][sAttr]._totalAmount) * 90;
                    }
                    oItem.uniquness.context[sModel][sAttr] = parseInt(iUniqueness, 10);
                } else {
                    //check if there is a binding referring to that element..
                    var bFound = false;
                    for (var sBndg in oItem.binding) {
                        if (oItem.binding[sBndg].path === sAttr) {
                            oItem.uniquness.context[sModel][sAttr] = oItem.uniquness.binding[sBndg]; //should be pretty good - we are binding on it..
                            bFound = true;
                            break;
                        }
                    }
                    if (bFound === false) {
                        //there is no binding, but we have a binding context - theoretically, we could "check the uniquness" as per the data available
                        //to really check the uniquness here, would require to scan all elements, and still wouldn't be great
                        //==>just skip
                        oItem.uniquness.context[sModel][sAttr] = 0;
                    }
                }
            }
        }
        return oItem;
    };

    TestHandler.prototype._setUniqunessInformation = function (oItem) {
        oItem = this._setUniqunessInformationElement(oItem);
        return oItem;
    }

    TestHandler.prototype._setItem = function (oControl, oDomNode, oOriginalDomNode) {
        var oItem = this._getElementInformation(oControl, oDomNode);
        oItem = this._setUniqunessInformation(oItem);
        oOriginalDomNode = oOriginalDomNode ? oOriginalDomNode : oDomNode;
        oItem.aggregationArray = [];
        oItem.parents = [];
        oItem.identifier.domIdOriginal = oOriginalDomNode.id;

        var aNode = this._getAllChildrenOfDom(oItem.control.getDomRef(), oItem.control);
        oItem.children = [];

        for (var i = 0; i < aNode.length; i++) {
            oItem.children.push({
                isInput: $(aNode[i]).is("input") || $(aNode[i]).is("textarea"),
                domChildWith: aNode[i].id.substr(oItem.control.getId().length)
            });
        }

        for (var sKey in oItem.aggregation) {
            oItem.aggregationArray.push(oItem.aggregation[sKey]);
        }
        var oItemCur = oItem.control;
        while (oItemCur) {
            oItemCur = _getParentWithDom(oItemCur, 1);
            if (!oItemCur) {
                break;
            }
            if (oItemCur && oItemCur.getDomRef && oItemCur.getDomRef()) {
                oItem.parents.push(this._getElementInformation(oItemCur, oItemCur.getDomRef ? oItemCur.getDomRef() : null, false));
            }
        }

        if (this._oCurrentDomNode) {
            $(this._oCurrentDomNode).removeClass('HVRReveal');
        }
        this._oCurrentDomNode = oDomNode;
        if (this._oCurrentDomNode) {
            $(this._oCurrentDomNode).addClass('HVRReveal');
        }

        return oItem;
    };

    TestHandler.prototype._getMergedClassArray = function (oItem) {
        var aClassArray = this._getClassArray(oItem);
        var oReturn = { defaultAction: { "": "" }, askForBindingContext: false, preferredProperties: [], cloned: false, actions: {} };
        //merge from button to top (while higher elements are overwriting lower elements)
        for (var i = 0; i < aClassArray.length; i++) {
            var oClass = aClassArray[i];
            oReturn.actions = oReturn.actions ? oReturn.actions : [];
            if (!oClass.defaultAction) {
                oClass.defaultAction = [];
            } else if (typeof oClass.defaultAction === "string") {
                oClass.defaultAction = [{
                    domChildWith: "", action: oClass.defaultAction
                }];
            }
            oReturn.cloned = oClass.cloned === true ? true : oReturn.cloned;
            oReturn.preferredProperties = oReturn.preferredProperties.concat(oClass.preferredProperties ? oClass.preferredProperties : []);
            var aElementsAttributes = [];

            for (var j = 0; j < oClass.defaultAction.length; j++) {
                oReturn.defaultAction[oClass.defaultAction[j].domChildWith] = oClass.defaultAction[j];
            }

            oReturn.askForBindingContext = typeof oClass.askForBindingContext !== "undefined" && oReturn.askForBindingContext === false ? oClass.askForBindingContext : oReturn.askForBindingContext;
            for (var sAction in oClass.actions) {
                if (typeof oReturn.actions[sAction] === "undefined") {
                    oReturn.actions[sAction] = oClass.actions[sAction];
                } else {
                    for (var j = 0; j < oClass.actions[sAction].length; j++) {
                        //remove all elements, with the same domChildWith, higher elements are more descriptive..
                        var aExisting = oReturn.actions[sAction].filter(function (e) { return e.domChildWith === oClass.actions[sAction][j].domChildWith; });
                        if (aExisting.length) {
                            aExisting[0] = oClass.actions[sAction][j];
                        } else {
                            oReturn.actions[sAction].push(oClass.actions[sAction][j]);
                        }
                    }
                }
            }
        }
        return oReturn;
    };

    TestHandler.prototype._getClassArray = function (oItem) {
        var oMetadata = oItem.control.getMetadata();
        var aReturn = [];
        while (oMetadata) {
            if (!oMetadata._sClassName) {
                break;
            }
            if (this._oElementMix[oMetadata._sClassName]) {
                aReturn.unshift(this._oElementMix[oMetadata._sClassName]);
            }
            oMetadata = oMetadata.getParent();
        };
        return $.extend(true, [], aReturn);
    };

    TestHandler.prototype.onClick = function (oDomNode, bAssertion) {
        var oControl = this._getControlFromDom(oDomNode);
        if (!oControl) {
            return;
        }
        //per default (on purpose) reset the clicked element to "root" - the user should activly (!!) set the lower aggregation as valid..
        var oOriginalDomNode = oDomNode;
        oDomNode = oControl.getDomRef();
        $(oDomNode).addClass('HVRReveal');
        this._resetCache();


        //in case we are actually a "local-id", and we do NOT have "sParentAggregationName" set, and our parent is undefined
        //this means that we are actually a dumbshit (100% depending) child control - we will move up in that case..
        if (!oControl.getParent() && !oControl.sParentAggregationName && RegExp("([A-Z,a-z,0-9])-([A-Z,a-z,0-9])").test(oControl.getId()) === true) {
            var sItem = oControl.getId().substring(0, oControl.getId().lastIndexOf("-"));
            var oCtrlTest = sap.ui.getCore().byId(sItem);
            if (oCtrlTest) {
                oControl = oCtrlTest;
                oDomNode = oControl.getDomRef();
            }
        }

        var oItem = this._setItem(oControl, oDomNode, oOriginalDomNode);
        //remove the "non-serializable" data..

        this.fireEventToContent("itemSelected", this._removeNonSerializable(oItem));
        this.lockScreen();
    };

    TestHandler.prototype._removeNonSerializable = function (oItem) {
        this._removeNonSerializableData(oItem);
        this._removeNonSerializableData(oItem.parent);
        this._removeNonSerializableData(oItem.parentL2);
        this._removeNonSerializableData(oItem.parentL3);
        this._removeNonSerializableData(oItem.parentL4);
        this._removeNonSerializableData(oItem.label);
        this._removeNonSerializableData(oItem.itemdata);
        for (var i = 0; i < oItem.parents.length; i++) {
            this._removeNonSerializableData(oItem.parents[i]);
        }
        return oItem;
    };

    TestHandler.prototype._removeNonSerializableData = function (oItem) {
        if (!oItem) {
            return;
        }
        delete oItem.control;
        delete oItem.dom;
    };

    TestHandler.prototype._resetCache = function () {
        oTestGlobalBuffer = {
            fnGetElement: {
                true: {},
                false: {}
            },
            findItem: {},
            fnGetElementInfo: {
                true: {},
                false: {}
            },
            label: null
        };
    };

    TestHandler.prototype.switch = function () {
        this._bActive = this._bActive !== true;
        this._bStarted = this._bActive;
        if (this._bActive === false) {
            //show code after finalizing
            this.showCode();
        }
    };

    TestHandler.prototype._start = function (oData) {
        this._bActive = true;
        this._bStarted = true;
        $(".HVRReveal").removeClass('HVRReveal');
        this.lockScreen(); //we are locked until the next step occurs, or the overall test is stopped..
        
        if (oData && oData.startImmediate === true) {
            if (!oLastDom && oData.domId) {
                oLastDom = document.getElementById(oData.domId);
            }
            if ( !oLastDom ) {
                oLastDom = document.activeElement;
            }
            
            //Directly select again (woop)
            setTimeout(function () {
                this.onClick(oLastDom);
                oLastDom = null;
                this._bActive = false;
            }.bind(this), 10);
        }
    };
    TestHandler.prototype._stop = function () {
        this._bActive = false;
        this._bStarted = false;
        $(".HVRReveal").removeClass('HVRReveal');
        this.fireEventToContent("stopped");
    };

    TestHandler.prototype.startFor = function (sId) {
        this._bActive = false;
        var oElement = document.getElementById(sId);
        if (!oElement) {
            return;
        }
        this.onClick(oElement, false);
    };

    TestHandler.prototype.__showFastInformation = function(event){
        this.__popover = new sap.m.Popover();
        var control = this._getControlFromDom(event.target);
        var controlInformation = new sap.ui.model.json.JSONModel({});
        controlInformation.setProperty('/controlClass', control.getMetadata()._sClassName);
        controlInformation.setProperty('/controlId', control.getId());
        var genIdPatt = new RegExp('__' + control.getMetadata()._sUIDToken + '[0-9]+');
        if(genIdPatt.exec(control.getId())) {
            controlInformation.setProperty('/generatedId', true);
        } else {
            controlInformation.setProperty('/generatedId', false);
        }
        var aPropertyMethods = [...new Set(control.getMetadata()._aAllPublicMethods.filter(m => m.startsWith('get')))];
        var aValues = aPropertyMethods
            .filter(m => typeof(control[m]) === 'function')
            .map(b => ({property: b.replace('get', ''), value: control[b]()}))
            .filter(o => Object.values(o)[0] !== null && typeof(Object.values(o)[0]) !== 'function' && typeof(Object.values(o)[0]) !== 'object'  && typeof(Object.values(o)[0]) !== 'undefined');

        controlInformation.setProperty('/primitiveProperties', aValues);
        this.__popover.setModel(controlInformation);

        this.__popover.setContentHeight('500px');
        this.__popover.setContentWidth('300px');
        this.__popover.setPlacement(sap.m.PlacementType.Auto);
        this.__popover.setTitle(controlInformation.getProperty('/controlClass'));

        var vBox = new sap.m.VBox();
        controlInformation.getProperty('/primitiveProperties')
                            .forEach(el => vBox.addItem(new sap.m.ObjectAttribute({title: el.property, text: el.value})));

        this.__popover.addContent(vBox);
        this.__popover.openBy(control);
        //debugger
    };

    TestHandler.prototype.init = function () {
        $(document).ready(function () {
            var that = this;

            //create our global overlay..
            $(document).on("keydown", function (e) {
                if (e.ctrlKey && e.altKey && e.shiftKey && e.which == 84) {
                    this._bActive = this._bActive !== true;
                } else if (e.keyCode == 27) {
                    if (this._bScreenLocked === true) {
                        this._stop(); //stop on escape
                    }
                }
            }.bind(this));

            $('*').mouseover(function (event) {
                if (this._bActive === false) {
                    return;
                }
                //this.__showFastInformation(event);
                $(event.target).addClass('HVRReveal');
            }.bind(this));
            $('*').mouseout(function (event) {
                if (!that._oDialog || !that._oDialog.isOpen()) {
                    $(event.target).removeClass('HVRReveal');
                }
                //this.__popover.close();
            }.bind(this));

            //avoid closing any popups.. this is an extremly dirty hack
            var fnOldEvent = sap.ui.core.Popup.prototype.onFocusEvent;
            sap.ui.core.Popup.prototype.onFocusEvent = function (oBrowserEvent) {
                if (that._bActive === false) {
                    if (that._bScreenLocked === false) {
                        return fnOldEvent.apply(this, arguments);
                    }
                }

                return;
            };

            $('*').on("mouseup mousedown mouseover mousemove mouseout", function (e) {
                if (this._bActive === false && this._bScreenLocked === false) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }.bind(this));


            $('*').click(function (event) {
                if (this._bActive === false) {
                    //no active recording, but still recording ongoing (e.g. in the other tab..)
                    if (this._bScreenLocked === true) {
                        sap.m.MessageToast.show("Please finalize the step in the Popup, before proceeding...");
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                    return;
                }

                this._bActive = false;
                this.onClick(event.target, event.ctrlKey === true);
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }.bind(this));
        }.bind(this));

        sap.m.MessageToast.show("Testing Framework Initialized...");
    };

    TestHandler.prototype._getParentWithDom = function (oItem, iCounter, bViewOnly) {
        oItem = oItem.control.getParent();
        while (oItem && oItem.getParent) {
            if (oItem.getDomRef && oItem.getDomRef()) {
                iCounter = iCounter - 1;
                if (iCounter <= 0) {
                    if (bViewOnly === true && !oItem.getViewData) {
                        oItem = oItem.getParent();
                        continue;
                    }
                    return this._getElementInformation(oItem, oItem.getDomRef());
                }
            }
            oItem = oItem.getParent();
        }
        return null;
    };

    TestHandler.prototype._lengthStatusFormatter = function (iLength) {
        return "Success";
    };

    TestHandler.prototype._getItemDataForItem = function (oItem) {
        var oCustom = _getItemForItem(oItem.control);
        if (oCustom) {
            return this._getElementInformation(oCustom, null);
        } else {
            return null;
        }
    };

    TestHandler.prototype._getLabelForItem = function (oItem) {
        if (oItem.label) {
            return oItem.label;
        }
        var oLabel = _getLabelForItem(oItem.control);
        if (!oLabel) {
            return null;
        }
        return this._getElementInformation(oLabel, oLabel.getDomRef());
    };

    TestHandler.prototype._getCriteriaTypes = function () {
        this._defineElementBasedActions();
    };

    TestHandler.prototype._defineElementBasedActions = function () {
        this._oElementMix = {
            "sap.m.StandardListItem": {
            },
            "sap.ui.core.Element": {
                defaultAction: "PRS",
                actions: {
                    "PRS": [{ text: "Root", domChildWith: "", order: 99 }],
                    "TYP": [{ text: "Root", domChildWith: "", order: 99 }]
                }
            },
            "sap.ui.core.Icon": {
                preferredProperties: ["src"]
            },
            "sap.m.List": {
                defaultInteraction: "root"
            },
            "sap.m.ObjectListItem": {
                cloned: true,
                defaultInteraction: "root",
                preferredProperties: ["title"]
            },
            "sap.m.Button": {
                defaultAction: "PRS",
                preferredProperties: ["text", "icon"]
            },
            "sap.m.ListItemBase": {
                cloned: true,
                askForBindingContext: true
            },
            "sap.ui.core.Item": {
                cloned: true
            },
            "sap.m.Link": {
            },
            "sap.m.ComboBoxBase": {
                defaultAction: "PRS",
                actions: {
                    "PRS": [{ text: "Arrow (Open List)", domChildWith: "-arrow", preferred: true, order: 1 }]
                }
            },
            "sap.m.GenericTile": {
                defaultAction: "PRS"
            },
            "sap.m.MultiComboBox": {
                defaultAction: "PRS",
                actions: {
                    "PRS": [{ text: "Arrow (Open List)", domChildWith: "-arrow", preferred: true, order: 1 }]
                }
            },
            "sap.m.Text": {
                preferredProperties: ["text"]
            },
            "sap.m.Select": {
                defaultAction: "PRS",
                actions: {
                    "PRS": [{ text: "Arrow (Open List)", domChildWith: "-arrow", preferred: true, order: 1 }]
                }
            },
            "sap.m.InputBase": {
                defaultAction: "TYP",
                actions: {
                    "TYP": [{ text: "In Input-Field", domChildWith: "-inner", preferred: true, order: 1 }]
                }
            },
            "sap.ui.table.Row": {
                cloned: true,
                defaultAction: "PRS",
                actions: {
                    "TYP": [{ text: "On Selection-Area", domChildWith: "-col0", preferred: true, order: 1 }]
                }
            },
            "sap.m.SearchField": {
                defaultAction: [{ domChildWith: "-search", action: "PRS" },
                { domChildWith: "-reset", action: "PRS" },
                { domChildWith: "", action: "TYP" }]
            }
        };
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ////BEGIN STACK UI5SELECTOR
    ////CODE BELOW IS NOT ALLOWED TO ACCESS ANY THIS METHOD
    ////The code is 1:1 copied to the corresponding UI5Selector Plugin
    ////Copying is not really nice, due to different languages (!) (typescript vs js) in the exceution phase
    ////all other approaches would just take unreasonabliy more time and effort
    ///METHOD: SEARCH
    //////////////////////////////////////////////////////////////////////////////////////////////////

    TestHandler.prototype._findItem = function (id) {
        var aItem = null; //jQuery Object Array
        if (typeof sap === "undefined" || typeof sap.ui === "undefined" || typeof sap.ui.getCore === "undefined" || !sap.ui.getCore() || !sap.ui.getCore().isInitialized()) {
            return [];
        }

        if (typeof id !== "string") {
            if (JSON.stringify(id) == JSON.stringify({})) {
                return [];
            }

            var oCoreObject = null;
            var fakePlugin = {
                startPlugin: function (core) {
                    oCoreObject = core;
                    return core;
                }
            };
            sap.ui.getCore().registerPlugin(fakePlugin);
            sap.ui.getCore().unregisterPlugin(fakePlugin);
            var aElements = oCoreObject.mElements;

            //search for identifier of every single object..
            var bFound = false;
            var sSelectorStringForJQuery = "";
            for (var sElement in aElements) {
                var oItem = aElements[sElement];
                bFound = true;
                bFound = _checkItem(oItem, id);
                if (bFound === false) {
                    continue;
                }
                if (id.label) {
                    bFound = bFound && _checkItem(_getLabelForItem(oItem), id.label);
                    if (bFound === false) {
                        continue;
                    }
                }

                //check parent levels..
                if (id.parent) {
                    bFound = bFound && _checkItem(_getParentWithDom(oItem, 1), id.parent);
                    if (bFound === false) {
                        continue;
                    }
                }
                if (id.parentL2) {
                    bFound = bFound && _checkItem(_getParentWithDom(oItem, 2), id.parentL2);
                    if (bFound === false) {
                        continue;
                    }
                }
                if (id.parentL3) {
                    bFound = bFound && _checkItem(_getParentWithDom(oItem, 3), id.parentL3);
                    if (bFound === false) {
                        continue;
                    }
                }
                if (id.parentL4) {
                    bFound = bFound && _checkItem(_getParentWithDom(oItem, 4), id.parentL4);
                    if (bFound === false) {
                        continue;
                    }
                }
                if (id.itemdata) {
                    bFound = bFound && _checkItem(_getItemForItem(oItem), id.itemdata);
                    if (bFound === false) {
                        continue;
                    }
                }

                if (bFound === false) {
                    continue;
                }

                if (!oItem.getDomRef()) {
                    continue;
                }

                var sIdFound = oItem.getDomRef().id;
                if (sSelectorStringForJQuery.length) {
                    sSelectorStringForJQuery = sSelectorStringForJQuery + ",";
                }
                sSelectorStringForJQuery += "*[id$='" + sIdFound + "']";
            }
            if (sSelectorStringForJQuery.length) {
                aItem = $(sSelectorStringForJQuery);
            } else {
                aItem = [];
            }
        } else {
            //our search for an ID is using "ends with", as we are using local IDs only (ignore component)
            //this is not really perfect for multi-component architecture (here the user has to add the component manually)
            //but sufficient for most approaches. Reason for removign component:
            //esnure testability both in standalone and launchpage enviroments
            if (id.charAt(0) === '#') {
                id = id.substr(1); //remove the trailing "#" if any
            }
            var searchId = "*[id$='" + id + "']";
            aItem = $(searchId);
        }
        if (!aItem || !aItem.length || !aItem.control() || !aItem.control().length) {
            return [];
        } //no ui5 contol in case

        //---postprocessing - return all items..
        return aItem.control();
    };

    TestHandler.prototype._getElementInformation = function (oItem, oDomNode, bFull) {
        var oReturn = {
            property: {},
            aggregation: {},
            association: {},
            context: {},
            metadata: {},
            identifier: { domId: "", ui5Id: "", idCloned: false, idGenerated: false, ui5LocalId: "", localIdClonedOrGenerated: false, ui5AbsoluteId: "" },
            parent: {},
            parentL2: {},
            parentL3: {},
            parentL4: {},
            itemdata: {},
            label: {},
            parents: [],
            control: null,
            dom: null
        };
        bFull = typeof bFull === "undefined" ? true : bFull;

        if (oTestGlobalBuffer["fnGetElementInfo"][bFull][oItem.getId()]) {
            return oTestGlobalBuffer["fnGetElementInfo"][bFull][oItem.getId()];
        }

        if (!oItem) {
            return oReturn;
        }

        //local methods on purpose (even if duplicated) (see above)
        oReturn = $.extend(true, oReturn, fnGetElementInformation(oItem, oDomNode, bFull));
        if (bFull === false) {
            oTestGlobalBuffer["fnGetElementInfo"][bFull][oItem.getId()] = oReturn;
            return oReturn;
        }
        //get all parents, and attach the same information in the same structure
        oReturn.parent = fnGetElementInformation(_getParentWithDom(oItem, 1), bFull);
        oReturn.parentL2 = fnGetElementInformation(_getParentWithDom(oItem, 2), bFull);
        oReturn.parentL3 = fnGetElementInformation(_getParentWithDom(oItem, 3), bFull);
        oReturn.parentL4 = fnGetElementInformation(_getParentWithDom(oItem, 4), bFull);
        oReturn.label = fnGetElementInformation(_getLabelForItem(oItem), bFull);
        oReturn.itemdata = fnGetElementInformation(_getItemForItem(oItem), bFull);

        oTestGlobalBuffer["fnGetElementInfo"][bFull][oItem.getId()] = oReturn;

        return oReturn;
    };

    TestHandlerSingleton = new TestHandler();

    var _getItemForItem = function (oItem) {
        //(0) check if we are already an item - no issue than..
        if (oItem instanceof sap.ui.core.Item) {
            return oItem;
        }

        //(1) check by custom data..
        if (oItem.getCustomData()) {
            for (var i = 0; i < oItem.getCustomData().length; i++) {
                var oObj = oItem.getCustomData()[i].getValue();
                if (oObj instanceof sap.ui.core.Item) {
                    return oObj;
                }
            }
        }

        //(2) no custom data? search for special cases
        //2.1: Multi-Combo-Box
        var oPrt = _getParentWithDom(oItem, 3);
        if (oPrt && oPrt.getMetadata().getElementName() === "sap.m.MultiComboBox") {
            if (oPrt._getItemByListItem) {
                var oCtrl = oPrt._getItemByListItem(oItem);
                if (oCtrl) {
                    return oCtrl;
                }
            }
        }
    };

    //on purpose implemented as local methods
    //this is not readable, but is a easy approach to transform those methods to the UI5Selector Stack (one single method approach)
    var _getParentWithDom = function (oItem, iCounter, bViewOnly) {
        oItem = oItem.getParent();
        while (oItem && oItem.getParent) {
            if (oItem.getMetadata && oItem.getMetadata().getElementName) { //dom is not required, but it must be a valid element name
                iCounter = iCounter - 1;
                if (bViewOnly === true && !oItem.getViewData) {
                    oItem = oItem.getParent();
                    continue;
                }
                if (iCounter <= 0) {
                    return oItem;
                }
            }
            oItem = oItem.getParent();
        }
        return null;
    };
    var _getUi5LocalId = function (oItem) {
        var sId = oItem.getId();
        if (sId.lastIndexOf("-") !== -1) {
            return sId.substr(sId.lastIndexOf("-") + 1);
        }
        return sId;
    };

    var _getAllLabels = function () {
        if (oTestGlobalBuffer.label) {
            return oTestGlobalBuffer.label;
        }
        oTestGlobalBuffer.label = {};
        var oCoreObject = null;
        var fakePlugin = {
            startPlugin: function (core) {
                oCoreObject = core;
                return core;
            }
        };
        sap.ui.getCore().registerPlugin(fakePlugin);
        sap.ui.getCore().unregisterPlugin(fakePlugin);
        for (var sCoreObject in oCoreObject.mElements) {
            var oObject = oCoreObject.mElements[sCoreObject];
            if (oObject.getMetadata()._sClassName === "sap.m.Label") {
                var oLabelFor = oObject.getLabelFor ? oObject.getLabelFor() : null;
                if (oLabelFor) {
                    oTestGlobalBuffer.label[oLabelFor] = oObject; //always overwrite - i am very sure that is correct
                } else {
                    //yes.. labelFor is maintained in one of 15 cases (fuck it)
                    //for forms it seems to be filled "randomly" - as apparently no developer is maintaing that correctly
                    //we have to search UPWARDS, and hope we are within a form.. in that case, normally we can just take all the fields aggregation elements
                    if (oObject.getParent() && oObject.getParent().getMetadata()._sClassName === "sap.ui.layout.form.FormElement") {
                        //ok.. we got luck.. let's assign all fields..
                        var oFormElementFields = oObject.getParent().getFields();
                        for (var j = 0; j < oFormElementFields.length; j++) {
                            if (!oTestGlobalBuffer.label[oFormElementFields[j].getId()]) {
                                oTestGlobalBuffer.label[oFormElementFields[j].getId()] = oObject;
                            }
                        }
                    }
                }
            }
        }

        //most simple approach is done.. unfortunatly hi
        return oTestGlobalBuffer.label;
    };

    var _getLabelForItem = function (oItem) {
        var aItems = _getAllLabels();
        return (aItems && aItems[oItem.getId()]) ? aItems[oItem.getId()] : null;
    };


    var _getUi5Id = function (oItem) {
        //remove all component information from the control
        var oParent = oItem;
        var sCurrentComponent = "";
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }
        if (!sCurrentComponent.length) {
            return oItem.getId();
        }

        var sId = oItem.getId();
        sCurrentComponent = sCurrentComponent + "---";
        if (sId.lastIndexOf(sCurrentComponent) !== -1) {
            return sId.substr(sId.lastIndexOf(sCurrentComponent) + sCurrentComponent.length);
        }
        return sId;
    };

    var _getOwnerComponent = function (oParent) {
        var sCurrentComponent = "";
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }
        return sCurrentComponent;
    };

    var _checkItem = function (oItem, id) {
        var bFound = true;
        if (!oItem) { //e.g. parent level is not existing at all..
            return false;
        }
        if (id.metadata) {
            if (id.metadata.elementName && id.metadata.elementName !== oItem.getMetadata().getElementName()) {
                return false;
            }
            if (id.metadata.componentName && id.metadata.componentName !== _getOwnerComponent(oItem)) {
                return false;
            }
        }

        if (id.viewProperty) {
            var oView = _getParentWithDom(oItem, 1, true);
            if (!oView) {
                return false;
            }

            var sViewName = oView.getProperty("viewName");
            var sViewNameLocal = sViewName.split(".").pop();
            if (sViewNameLocal.length) {
                sViewNameLocal = sViewNameLocal.charAt(0).toUpperCase() + sViewNameLocal.substring(1);
            }

            if (id.viewProperty.viewName && id.viewProperty.viewName !== sViewName) {
                return false;
            }
            if (id.viewProperty.localViewName && id.viewProperty.localViewName !== sViewNameLocal) {
                return false;
            }
        }

        if (id.domChildWith && id.domChildWith.length > 0) {
            var oDomRef = oItem.getDomRef();
            if (!oDomRef) {
                return false;
            }
            if ($("*[id$='" + oDomRef.id + id.domChildWith + "']").length === 0) {
                return false;
            }
        }

        if (id.model) {
            for (var sModel in id.model) {
                sModel = sModel === "undefined" ? undefined : sModel;
                if (!oItem.getModel(sModel)) {
                    return false;
                }
                for (var sModelProp in id.model[sModel]) {
                    if (oItem.getModel(sModel).getProperty(sModelProp) !== id.model[sModel][sModelProp]) {
                        return false;
                    }
                }
            }
        }

        if (id.identifier) {
            if (id.identifier.ui5Id && id.identifier.ui5Id !== _getUi5Id(oItem)) {
                return false;
            }
            if (id.identifier.ui5LocalId && id.identifier.ui5LocalId !== _getUi5LocalId(oItem)) {
                return false;
            }
        }

        if (id.binding) {
            for (var sBinding in id.binding) {
                var oAggrInfo = oItem.getBindingInfo(sBinding);
                if (!oAggrInfo) {
                    //SPECIAL CASE for sap.m.Label in Forms, where the label is actually bound against the parent element (yay)
                    if (oItem.getMetadata().getElementName() === "sap.m.Label") {
                        if (oItem.getParent() && oItem.getParent().getMetadata()._sClassName === "sap.ui.layout.form.FormElement") {
                            var oParentBndg = oItem.getParent().getBinding("label");
                            if (!oParentBndg || oParentBndg.getPath() !== id.binding[sBinding].path) {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    var oBinding = oItem.getBinding(sBinding);
                    if (!oBinding) {
                        if (oAggrInfo.path !== id.binding[sBinding].path) {
                            return false;
                        }
                    } else {
                        if (oBinding.getPath() !== id.binding[sBinding].path) {
                            return false;
                        }
                    }
                }
            }
        }

        if (id.aggregation) {
            for (var sAggregationName in id.aggregation) {
                var oAggr = id.aggregation[sAggregationName];
                if (!oAggr.name) {
                    continue; //no sense to search without aggregation name..
                }
                if (typeof oAggr.length !== "undefined") {
                    if (oItem.getAggregation(sAggregationName).length !== oAggr.length) {
                        bFound = false;
                    }
                }
                if (bFound === false) {
                    return false;
                }
            }
        }
        if (id.context) {
            for (var sModel in id.context) {
                var oCtx = oItem.getBindingContext(sModel === "undefined" ? undefined : sModel);
                if (!oCtx) {
                    return false;
                }
                var oObjectCompare = oCtx.getObject();
                if (!oObjectCompare) {
                    return false;
                }
                var oObject = id.context[sModel];
                for (var sAttr in oObject) {
                    if (oObject[sAttr] !== oObjectCompare[sAttr]) {
                        return false;
                    }
                }
            }
        }
        if (id.property) {
            for (var sProperty in id.property) {
                if (!oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]) {
                    //property is not even available in that item.. just skip it..
                    bFound = false;
                    break;
                }
                var sPropertyValueItem = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]();
                var sPropertyValueSearch = id.property[sProperty];
                if (sPropertyValueItem !== sPropertyValueSearch) {
                    bFound = false;
                    break;
                }
            }
            if (bFound === false) {
                return false;
            }
        }
        return true;
    };

    var fnGetElementInformation = function (oItem, oDomNode, bFull) {
        var oReturn = {
            property: {},
            aggregation: [],
            association: {},
            binding: {},
            context: {},
            model: {},
            metadata: {},
            viewProperty: {},
            classArray: [],
            identifier: { domId: "", ui5Id: "", idCloned: false, idGenerated: false, ui5LocalId: "", localIdClonedOrGenerated: false, ui5AbsoluteId: "" },
            control: null,
            dom: null
        };
        bFull = typeof bFull === "undefined" ? true : bFull;

        if (!oItem) {
            return oReturn;
        }
        if (oTestGlobalBuffer["fnGetElement"][bFull][oItem.getId()]) {
            return oTestGlobalBuffer["fnGetElement"][bFull][oItem.getId()];
        }
        if (!oDomNode && oItem.getDomRef) {
            oDomNode = oItem.getDomRef();
        }

        oReturn.control = oItem;
        oReturn.dom = oDomNode;
        oReturn.identifier.ui5Id = _getUi5Id(oItem);
        oReturn.identifier.ui5LocalId = _getUi5LocalId(oItem);


        oReturn.classArray = [];
        var oMeta = oItem.getMetadata();
        while (oMeta) {
            oReturn.classArray.push({
                elementName: oMeta._sClassName
            });
            oMeta = oMeta.getParent();
        }

        //does the ui5Id contain a "-" with a following number? it is most likely a dependn control (e.g. based from aggregation or similar)
        if (RegExp("([A-Z,a-z,0-9])-([0-9])").test(oReturn.identifier.ui5Id) === true) {
            oReturn.identifier.idCloned = true;
        } else {
            //check as per metadata..
            var oMetadata = oItem.getMetadata();
            while (oMetadata) {
                if (!oMetadata._sClassName) {
                    break;
                }
                if (["sap.ui.core.Item", "sap.ui.table.Row", "sap.m.ObjectListItem"].indexOf(oMetadata._sClassName) !== -1) {
                    oReturn.identifier.idCloned = true;
                }
                oMetadata = oMetadata.getParent();
            }
        }
        //does the ui5id contain a "__"? it is most likely a generated id which should NOT BE USESD!!
        //check might be enhanced, as it seems to be that all controls are adding "__[CONTORLNAME] as dynamic view..
        if (oReturn.identifier.ui5Id.indexOf("__") !== -1) {
            oReturn.identifier.idGenerated = true;
        }
        if (oDomNode) {
            oReturn.identifier.domId = oDomNode.id;
        }
        if (oReturn.identifier.idCloned === true || oReturn.identifier.ui5LocalId.indexOf("__") !== -1) {
            oReturn.identifier.localIdClonedOrGenerated = true;
        }
        oReturn.identifier.ui5AbsoluteId = oItem.getId();

        //get metadata..
        oReturn.metadata = {
            elementName: oItem.getMetadata().getElementName(),
            componentName: _getOwnerComponent(oItem),
            componentId: "",
            componentTitle: "",
            componentDescription: "",
            componentDataSource: {}
        };
        //enhance component information..
        var oComponent = sap.ui.getCore().getComponent(oReturn.metadata.componentName);
        if (oComponent) {
            var oManifest = oComponent.getManifest();
            if (oManifest && oManifest["sap.app"]) {
                var oApp = oManifest["sap.app"];
                oReturn.metadata.componentId = oApp.id;
                oReturn.metadata.componentTitle = oApp.title;
                oReturn.metadata.componentDescription = oApp.description;
                if (oApp.dataSources) {
                    for (var sDs in oApp.dataSources) {
                        var oDS = oApp.dataSources[sDs];
                        if (oDS.type !== "OData") {
                            continue;
                        }
                        oReturn.metadata.componentDataSource[sDs] = {
                            uri: oDS.uri,
                            localUri: (oDS.settings && oDS.settings.localUri) ? oDS.settings.localUri : ""
                        };
                    }
                }
            }
        }

        if (bFull === false) {
            oTestGlobalBuffer["fnGetElement"][bFull][oItem.getId()] = oReturn;
            return oReturn;
        }

        //view..
        var oView = _getParentWithDom(oItem, 1, true);
        if (oView) {
            if (oView.getProperty("viewName")) {
                oReturn.viewProperty.viewName = oView.getProperty("viewName");
                oReturn.viewProperty.localViewName = oReturn.viewProperty.viewName.split(".").pop();
                if (oReturn.viewProperty.localViewName.length) {
                    oReturn.viewProperty.localViewName = oReturn.viewProperty.localViewName.charAt(0).toUpperCase() + oReturn.viewProperty.localViewName.substring(1);
                }
            }
        }

        //bindings..
        for (var sBinding in oItem.mBindingInfos) {
            var oBindingInfo = oItem.getBindingInfo(sBinding);
            var oBinding = oItem.getBinding(sBinding);
            if (!oBindingInfo) {
                continue;
            }

            //not really perfect for composite bindings (what we are doing here) - we are just returning the first for that..
            //in case of a real use case --> enhance
            var oRelevantPart = oBindingInfo;
            if (oBindingInfo.parts && oBindingInfo.parts.length > 0 ) {
                oRelevantPart = oBindingInfo.parts[0];
            }

            if (oBinding) {
                oReturn.binding[sBinding] = {
                    model: oRelevantPart.model,
                    path: oBinding.sPath && oBinding.getPath(),
                    static: oBinding.oModel && oBinding.getModel() instanceof sap.ui.model.resource.ResourceModel
                };
            } else {
                oReturn.binding[sBinding] = {
                    path: oBindingInfo.path,
                    model: oRelevantPart.model,
                    static: true
                };
                /*if (oBindingInfo.parts && oBindingInfo.parts.length > 0) {
                    for (var i = 0; i < oBindingInfo.parts.length; i++) {
                        if (!oBindingInfo.parts[i].path) {
                            continue;
                        }
                        if (!oReturn.binding[sBinding]) {
                            oReturn.binding[sBinding] = { path: oBindingInfo.parts[i].path, "static": true };
                        } else {
                            oReturn.binding[sBinding].path += ";" + oBindingInfo.parts[i].path;
                        }
                    }
                }*/
            }
        }

        //very special for "sap.m.Label"..
        if (oReturn.metadata.elementName === "sap.m.Label" && !oReturn.binding.text) {
            if (oItem.getParent() && oItem.getParent().getMetadata()._sClassName === "sap.ui.layout.form.FormElement") {
                var oParentBndg = oItem.getParent().getBinding("label");
                if (oParentBndg) {
                    oReturn.binding["text"] = {
                        path: oParentBndg.sPath && oParentBndg.getPath(),
                        "static": oParentBndg.oModel && oParentBndg.getModel() instanceof sap.ui.model.resource.ResourceModel
                    };
                }
            }
        }


        //return all simple properties
        for (var sProperty in oItem.mProperties) {
            oReturn.property[sProperty] = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]();
        }

        //return all binding contexts
        oReturn.context = fnGetContexts(oItem);

        //get model information..
        var oMetadata = oItem.getMetadata();
        oReturn.model = {};

        //return length of all aggregations
        var aMetadata = oItem.getMetadata().getAllAggregations();
        for (var sAggregation in aMetadata) {
            if (aMetadata[sAggregation].multiple === false) {
                continue;
            }
            var aAggregation = oItem["get" + sAggregation.charAt(0).toUpperCase() + sAggregation.substr(1)]();
            var oAggregationInfo = {
                rows: [],
                filled: false,
                name: sAggregation,
                length: 0
            };
            if (typeof aAggregation !== "undefined" && aAggregation !== null) {
                oAggregationInfo.filled = true;
                oAggregationInfo.length = aAggregation.length;
            }

            //for every single line, get the binding context, and the row id, which can later on be analyzed again..
            for (var i = 0; i < aAggregation.length; i++) {
                oAggregationInfo.rows.push({
                    context: fnGetContexts(aAggregation[i]),
                    ui5Id: _getUi5Id(aAggregation[i]),
                    ui5AbsoluteId: aAggregation[i].getId()
                });
            }
            oReturn.aggregation[oAggregationInfo.name] = oAggregationInfo;
        }

        oTestGlobalBuffer["fnGetElement"][bFull][oItem.getId()] = oReturn;
        return oReturn;
    };


    //missing: get elements with same parent, to get elements "right next", "left" and on same level
    var fnGetContexts = function (oItem) {
        var oReturn = {};

        if (!oItem) {
            return oReturn;
        }

        var oModel = {};
        oModel = $.extend(true, oModel, oItem.oModels);
        oModel = $.extend(true, oModel, oItem.oPropagatedProperties.oModels);

        //second, get all binding contexts
        for (var sModel in oModel) {
            var oBindingContext = oItem.getBindingContext(sModel === "undefined" ? undefined : sModel);
            if (!oBindingContext) {
                continue;
            }

            var oCtxData = oBindingContext.getObject();
            oReturn[sModel] = {};

            //remove all properties which are a deep object..
            for (var sProperty in oCtxData) {
                var sType = typeof oCtxData[sProperty];
                if (sType === "number" || sType === "boolean" || sType === "string") {
                    oReturn[sModel][sProperty] = oCtxData[sProperty];
                    continue;
                }
            }
        }
        return oReturn;
    };
}