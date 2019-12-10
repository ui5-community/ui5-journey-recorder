"use strict";

/**
 * Message passing to and from Extension - START
 */

function messageToExtension(sType, oData) {
    window.postMessage({
        origin: "FROM_PAGE",
        type: sType,
        data: oData
    });
}

function messageFromExtension(oEvent) {
    //We only accept messages from ourselves
    if (oEvent.source !== window) {
        return;
    }

    if (event.data.type && (event.data.origin === "FROM_EXTENSION")) {
        console.log("Page injection received message: ");
        console.log("- type: " + oEvent.data.type);
        console.log("- data: " + JSON.stringify(oEvent.data.data));

        handleEvent(oEvent);
    }

}

function handleEvent(oEvent) {
    console.log('Find suitable event handling strategy');
}
/**
 * Message passing to and from Extension - END
 */

/**
 * UI5-Testrecorder Page inject setup STARTUP Coding - START
 */
function setupTestRecorderFunctions() {
    //setup listener for messages from the Extension
    window.addEventListener("message", messageFromExtension);
    setupPageListener();
    startRecording();
}

function ui5Check() {
    var oData = {};
    if (window.sap && window.sap.ui) {
        oData.ui5 = true;

        // Get framework version
        try {
            oData.version = sap.ui.getVersionInfo().version;
        } catch (e) {
            oData.version = '';
        }

        // Get framework name
        try {
            var versionInfo = sap.ui.getVersionInfo();

            // Use group artifact version for maven builds or name for other builds (like SAPUI5-on-ABAP)
            var frameworkInfo = versionInfo.gav ? versionInfo.gav : versionInfo.name;

            oData.name = frameworkInfo.indexOf('openui5') !== -1 ? 'OpenUI5' : 'SAPUI5';
        } catch (e) {
            oData.name = 'UI5';
        }

        // Check if the version is supported
        oData.isVersionSupported = !!sap.ui.require;

    } else {
        oData.ui5 = false;
    }
    return oData;
}

function test() {

    console.log('- checking UI5 appearance...');
    const maxWaitTime = 3000;
    var waited = 0;
    var intvervalID = setInterval(function () {
        waited = waited + 100;
        if (waited % 500 === 0) {
            console.log('- checking UI5 appearance...');
        }
        var oCheckData = ui5Check();
        if (oCheckData.ui5) {
            clearInterval(intvervalID);
            setupTestRecorderFunctions();
            messageToExtension("inject-init", oCheckData);
        } else if (waited > maxWaitTime) {
            clearInterval(intvervalID);
            messageToExtension("inject-init", oCheckData);
        }
    }, 100);
}
/**
 *  UI5-Testrecorder Page inject setup STARTUP Coding - END
 */

/**
 * UI5-Testrecorder Page Inject functional coding - START
 */
var _bActive = false,
    _bScreenLocked = false,
    _bStarted = false,
    _oDialog = null;

function startRecording() {
    _bActive = true;
    _bStarted = true;
}

function setupPageListener() {
    /** use the css hovering class */
    document.onmouseover = function (e) {
        if (_bActive === false) {
            return;
        }
        var e = e || window.event,
            el = e.target || e.srcElement;
        el.classList.add("UI5TR_ElementHover");
    };

    document.onmouseout = function (e) {
        if (!_oDialog || !_oDialog.isOpen()) {
            var e = e || window.event,
                el = e.target || e.srcElement;
            el.classList.remove("UI5TR_ElementHover");
        }
    };

    document.onclick = function (e) {
        var e = e || window.event,
            el = e.target || e.srcElement;

        if (_bActive === false) {
            //no active recording, but still recording ongoing (e.g. in the other tab..)
            if (_bScreenLocked === true) {
                sap.m.MessageToast.show("Please finalize the step in the Popup, before proceeding...");
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
            return;
        }

        _bActive = false;
        onClick(el);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    };

    sap.m.MessageToast.show("UI5-Testrecorder fully injected!");
}

function onClick(oDOMNode) {

    console.debug("pageInject.onClick – Clicked on: %o", oDOMNode);

    // get control for given DOM node
    var oControl = UI5ControlHelper.getControlFromDom(oDOMNode);
    // if there is no control, return rightaway
    if (!oControl) {
        return;
    }

    // reset the clicked element to "root", as the user should activly (!!)
    // set the lower aggregation as valid
    var oOriginalDomNode = oDOMNode; // backup for original
    oDOMNode = oControl.getDomRef(); // get DOM reference for found control

    // in the case that the control's parent is undefined, the attribute 'sParentAggregationName' is NOT set, and
    // actually have a "local ID", this means that we have found an actually 100% depending child control.
    // we will move up in that case..
    if (!oControl.getParent() && !oControl.sParentAggregationName &&
        RegExp("([A-Z,a-z,0-9])-([A-Z,a-z,0-9])").test(oControl.getId()) === true) {

        // get ID of parent control
        var sItem = oControl.getId().substring(0, oControl.getId().lastIndexOf("-"));
        // obtain corresponding control
        var oCtrlTest = sap.ui.getCore().byId(sItem);

        // if we found a valid parent element, set this as the control to be returned
        if (oCtrlTest) {
            oControl = oCtrlTest;
            oDOMNode = oControl.getDomRef();
        }
    }

    console.debug("pageInject.onClick – Found control: %o", oDOMNode);

    // highlight found DOM element of control on the site:
    // 1) remove all previously enabled highlightings
    var prevFoundElements = document.getElementsByClassName("UI5TR_ControlFound");
    Array.prototype.forEach.call(prevFoundElements, function (oElement) {
        oElement.classList.remove("UI5TR_ControlFound");
        oElement.classList.remove("UI5TR_ControlFound_InlineFix");
    });
    // 2) highlight the new element
    oDOMNode.classList.add("UI5TR_ControlFound");
    // 3) ensure that class is displayed properly (e.g., DIV elements with 'display: inline'
    // do not display background)
    if (window.getComputedStyle(oDOMNode)["display"] === "inline") {
        oDOMNode.classList.add("UI5TR_ControlFound_InlineFix");
    }

    // send control to extension for testing:
    // 0) construct test item
    var oTestItem = new TestItem(oControl, oDOMNode, oOriginalDomNode);
    // 1) enhance with meta data
    oTestItem.initializeTestItem();
    // 3) send item to extension
    messageToExtension("itemSelected", oTestItem.getTestItem());

    // lock screen to indicate switch to extension
    lockScreen();
}

function lockScreen() {
    _bScreenLocked = true;
};

function unlockScreen() {
    _bScreenLocked = false;
};

// #region class TestItem

/**
 * TestItem class.
 *
 * There are three steps to perform:
 * 1. Construct a new object.
 * 2. Call .initializeTestItem() on object.
 * 3. Call .getTestItem() on object to retrieve initialized item.
 *
 * @constructor
 * @param {sap.ui.core.Element} oControl the UI5 control to handle
 * @param {HTMLElement} oDOMNode the corresponding selected DOM node
 * @param {HTMLElement} oOriginalDOMNode the DOM node that has been initially selected on the site
 */
class TestItem {

    /**
     * Global control cache for easier retrieval of visited controls.
     *
     * @see _resetCache initialization
     */
    static _oTestGlobalCache = null;

    /**
     * Resets the static variable {@link oTestGlobalBuffer}.
     */
    static _resetCache() {
        TestItem._oTestGlobalCache = {
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
    }

    constructor(oControl, oDOMNode, oOriginalDomNode) {
        this._oControl = oControl;
        this._oDOMNode = oDOMNode;
        this._oOriginalDomNode = oOriginalDomNode;
        this._testItem = null;

        TestItem._resetCache();
    }

    /**
     * Initialize the control item in context of the selected DOM nodes for
     * being used in test steps.
     *
     * This function basically enhances the control with needed attributes (such as information
     * on parents) and removes unserializable content.
     */
    initializeTestItem() {
        // TODO: @Adrian - Fix bnd-ctxt uiveri5 2019/06/25

        var oItem = TestItem._getElementInformation(this._oControl, this._oDOMNode);
        oItem = TestItem._setUniqunessInformationElement(oItem);
        this._oOriginalDOMNode = this._oOriginalDOMNode ? this._oOriginalDOMNode : this._oDOMNode;
        oItem.aggregationArray = [];
        oItem.parents = [];
        oItem.identifier.domIdOriginal = this._oOriginalDOMNode.id;

        var aNode = UI5ControlHelper._getAllChildrenOfDom(oItem.control.getDomRef(), oItem.control);
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
            oItemCur = UI5ControlHelper.getParentControlAtLevel(oItemCur, 1);
            if (!oItemCur) {
                break;
            }
            if (oItemCur && oItemCur.getDomRef && oItemCur.getDomRef()) {
                oItem.parents.push(TestItem._getElementInformation(oItemCur, oItemCur.getDomRef ? oItemCur.getDomRef() : null, false));
            }
        }

        oItem = TestItem._removeNonSerializable(oItem);

        this._testItem = oItem;
    }

    /**
     * Return inialized test item.
     *
     * @returns {Object} the initalized test item
     */
    getTestItem() {
        if (!this._testItem) {
            console.log("Test item not initalized. Initializing now...");
            this.initializeItem();
        }

        return this._testItem;
    }

    // #region Information retrieval

    static _getElementInformation(oControl, oDOMNode, bFull = true) {

        function getElementInformationDetails(oItem, oDomNode, bFull = true) {
            var oReturn = {
                property: {},
                aggregation: [],
                association: {},
                binding: {},
                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                bindingContext: {},
                context: {},
                model: {},
                metadata: {},
                viewProperty: {},
                classArray: [],
                identifier: {
                    domId: "",
                    ui5Id: "",
                    idCloned: false,
                    idGenerated: false,
                    ui5LocalId: "",
                    localIdClonedOrGenerated: false,
                    ui5AbsoluteId: ""
                },
                control: null,
                dom: null
            };

            if (!oItem) {
                return oReturn;
            }
            if (TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()]) {
                return TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()];
            }
            if (!oDomNode && oItem.getDomRef) {
                oDomNode = oItem.getDomRef();
            }

            oReturn.control = oItem;
            oReturn.dom = oDomNode;
            oReturn.identifier.ui5Id = UI5ControlHelper.getUi5Id(oItem);
            oReturn.identifier.ui5LocalId = UI5ControlHelper.getUi5LocalId(oItem);


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
                componentName: UI5ControlHelper.getOwnerComponent(oItem),
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
                TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()] = oReturn;
                return oReturn;
            }

            //view..
            var oView = UI5ControlHelper.getParentControlAtLevel(oItem, 1, true);
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
                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                oReturn.binding[sBinding] = UI5ControlHelper.getBindingInformation(oItem, sBinding);
                /*@Adrian - Start
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
                    //if (oBindingInfo.parts && oBindingInfo.parts.length > 0) {
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
                    }//
                }
                @Adrian - End*/
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

            //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
            /*@Adrian - Start*/
            //binding context
            var aModels = UI5ControlHelper.getContextModels(oItem);
            for (var sModel in aModels) {
                var oBndg = UI5ControlHelper.getBindingContextInformation(oItem, sModel);
                if (!oBndg) {
                    continue;
                }
                oReturn.bindingContext[sModel] = oBndg;
            }
            /*@Adrian - End*/

            //return all simple properties
            for (var sProperty in oItem.mProperties) {
                var fnGetter = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)];
                if (fnGetter) {
                    oReturn.property[sProperty] = fnGetter.call(oItem);
                } else {
                    oReturn.property[sProperty] = oItem.mProperties[sProperty];
                }
            }

            //return all binding contexts
            oReturn.context = UI5ControlHelper.getContexts(oItem);

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
                        context: UI5ControlHelper.getContexts(aAggregation[i]),
                        ui5Id: UI5ControlHelper.getUi5Id(aAggregation[i]),
                        ui5AbsoluteId: aAggregation[i].getId()
                    });
                }
                oReturn.aggregation[oAggregationInfo.name] = oAggregationInfo;
            }

            TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()] = oReturn;
            return oReturn;
        }

        var oReturn = {
            property: {},
            aggregation: {},
            association: {},
            context: {},
            metadata: {},
            identifier: {
                domId: "",
                ui5Id: "",
                idCloned: false,
                idGenerated: false,
                ui5LocalId: "",
                localIdClonedOrGenerated: false,
                ui5AbsoluteId: ""
            },
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

        // return cached item rightaway
        if (TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()]) {
            return TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()];
        }

        // if there is no control given, return empty information object
        if (!oControl) {
            return oReturn;
        }

        //local methods on purpose (even if duplicated) (see above)
        oReturn = $.extend(true, oReturn, getElementInformationDetails(oControl, oDOMNode, bFull));
        if (bFull === false) {
            TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()] = oReturn;
            return oReturn;
        }
        //get all parents, and attach the same information in the same structure
        oReturn.parent = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 1), bFull);
        oReturn.parentL2 = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 2), bFull);
        oReturn.parentL3 = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 3), bFull);
        oReturn.parentL4 = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 4), bFull);
        oReturn.label = getElementInformationDetails(UI5ControlHelper.getLabelForItem(oControl), bFull);
        oReturn.itemdata = getElementInformationDetails(UI5ControlHelper.getItemDataForItem(oControl), bFull);

        TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()] = oReturn;

        return oReturn;
    }

    static _setUniqunessInformationElement(oItem) {
        var iUniqueness = 0;
        var oMerged = UI5ControlHelper._getMergedControlClassArray(oItem);
        oItem.uniquness = {
            property: {},
            context: {},
            binding: {},
            //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
            bindingContext: {}
        };

        //create uniquness for properties..
        var oObjectProps = {};
        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
        var oObjectBndngs = {};
        var oObjectCtx = {};
        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
        var oObjectBndngContexts = {};
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
                        oObjectCtx[sModel] = {};
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
                        oObjectCtx[sModel][sCtx]._differentValues = TestItem._getPropertiesInArray(oObjectCtx[sModel][sCtx]);
                    }
                }

                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                /*@Adrian - Start*/
                for (var sProperty in oItem.bindingContext) {
                    if (!oObjectBndngContexts[sProperty]) {
                        oObjectBndngContexts[sProperty] = {
                            _totalAmount: 0
                        };
                    }

                    var sValue = UI5ControlHelper.getBindingContextInformation(aItems[i], sProperty);
                    if (!oObjectBndngContexts[sProperty][sValue]) {
                        oObjectBndngContexts[sProperty][sValue] = 0;
                    }
                    oObjectBndngContexts[sProperty][sValue] = oObjectBndngContexts[sProperty][sValue] + 1;
                    oObjectBndngContexts[sProperty]._totalAmount = oObjectBndngContexts[sProperty]._totalAmount + 1;
                }
                for (var sProperty in oItem.bindingContext) {
                    oObjectBndngContexts[sProperty]._differentValues = TestItem._getPropertiesInArray(oObjectBndngContexts[sProperty]);
                }

                for (var sProperty in oItem.binding) {
                    if (!oObjectBndngs[sProperty]) {
                        oObjectBndngs[sProperty] = {
                            _totalAmount: 0
                        };
                    }

                    var sValue = UI5ControlHelper.getBindingInformation(aItems[i], sProperty).path;
                    if (!oObjectBndngs[sProperty][sValue]) {
                        oObjectBndngs[sProperty][sValue] = 0;
                    }
                    oObjectBndngs[sProperty][sValue] = oObjectBndngs[sProperty][sValue] + 1;
                    oObjectBndngs[sProperty]._totalAmount = oObjectBndngs[sProperty]._totalAmount + 1;
                }
                for (var sProperty in oItem.binding) {
                    oObjectBndngs[sProperty]._differentValues = TestItem._getPropertiesInArray(oObjectBndngs[sProperty]);
                }

                /*@Adrian - End*/
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
                    oObjectProps[sProperty]._differentValues = TestItem._getPropertiesInArray(oObjectProps[sProperty]);
                }
            }
        }

        for (var sAttr in oItem.property) {
            iUniqueness = 0;
            var oAttrMeta = oItem.control.getMetadata().getProperty(sAttr);
            if (oAttrMeta && oAttrMeta.defaultValue && oAttrMeta.defaultValue === oItem.property[sAttr]) {
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
                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                /*@Adrian - Start
                //we are > 0 - our uniquness is 0, as bindings as MOST CERTAINLY not done per item (but globally)
                iUniqueness = 0;
                  @Adrian - End */
                /*@Adrian - Start*/
                //we are > 0 - our uniquness is 0, our binding will contain a primary key for the list binding
                if (oObjectBndngs[sAttr]._totalAmount === oObjectBndngs[sAttr]._differentValues) {
                    //seems to be a key field.. great
                    iUniqueness = 100;
                } else {
                    iUniqueness = ((oObjectBndngs[sAttr]._totalAmount + 1 - oObjectBndngs[sAttr][oItem.binding[sAttr].path]) / oObjectBndngs[sAttr]._totalAmount) * 90;
                }
                /*@Adrian - End*/
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

        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
        /*@Adrian - Start*/
        for (var sAttr in oItem.bindingContext) {
            iUniqueness = 0;
            if (oMerged.cloned === true) {
                //we are > 0 - our uniquness is 0, our binding will contain a primary key for the list binding
                if (oObjectBndngContexts[sAttr]._totalAmount === oObjectBndngContexts[sAttr]._differentValues) {
                    //seems to be a key field.. great
                    iUniqueness = 100;
                } else {
                    iUniqueness = ((oObjectBndngContexts[sAttr]._totalAmount + 1 - oObjectBndngContexts[sAttr][oItem.bindingContext[sAttr]]) / oObjectBndngContexts[sAttr]._totalAmount) * 90;
                }
            } else {
                iUniqueness = 0; //not cloned - probably not good..
            }
            oItem.uniquness.bindingContext[sAttr] = parseInt(iUniqueness, 10);
        }
        /*@Adrian - End*/
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
    }

    static _removeNonSerializable(oItem) {

        function _removeNonSerializableData(oSingleItem) {
            if (!oSingleItem) {
                return;
            }

            delete oSingleItem.control;
            delete oSingleItem.dom;
        }

        // 1) item itself
        _removeNonSerializableData(oItem);

        // 2) various properties
        var aProperties = ["parent", "parentL2", "parentL3", "parentL4", "label", "itemdata"];
        aProperties.forEach(function (sProperty) {
            _removeNonSerializableData(oItem[sProperty]);
        });

        // 3) all parents
        oItem.parents.forEach(function (oParent) {
            _removeNonSerializableData(oParent);
        });

        return oItem;
    }

    // #endregion

    // #region Utility functions

    static _getPropertiesInArray(oObj) {
        var i = 0;
        for (var sAttr in oObj) {
            if (sAttr.indexOf("_") === 0) {
                continue;
            }
            i += 1;
        }
        return i;
    }

    // #endregion

}

// #endregion

// #region UI5ControlHelper

class UI5ControlHelper {

    /**
     * Default properties for common controls.
     */
    static _oElementMix = {
        "sap.m.StandardListItem": {},
        "sap.ui.core.Element": {
            defaultAction: "PRS",
            actions: {
                "PRS": [{
                    text: "Root",
                    domChildWith: "",
                    order: 99
                }],
                "TYP": [{
                    text: "Root",
                    domChildWith: "",
                    order: 99
                }]
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
        "sap.m.Link": {},
        "sap.m.ComboBoxBase": {
            defaultAction: "PRS",
            actions: {
                "PRS": [{
                    text: "Arrow (Open List)",
                    domChildWith: "-arrow",
                    preferred: true,
                    order: 1
                }]
            }
        },
        "sap.m.GenericTile": {
            defaultAction: "PRS"
        },
        "sap.m.MultiComboBox": {
            defaultAction: "PRS",
            actions: {
                "PRS": [{
                    text: "Arrow (Open List)",
                    domChildWith: "-arrow",
                    preferred: true,
                    order: 1
                }]
            }
        },
        "sap.m.Text": {
            preferredProperties: ["text"]
        },
        "sap.m.Select": {
            defaultAction: "PRS",
            actions: {
                "PRS": [{
                    text: "Arrow (Open List)",
                    domChildWith: "-arrow",
                    preferred: true,
                    order: 1
                }]
            }
        },
        "sap.m.InputBase": {
            defaultAction: "TYP",
            actions: {
                "TYP": [{
                    text: "In Input-Field",
                    domChildWith: "-inner",
                    preferred: true,
                    order: 1
                }]
            }
        },
        "sap.ui.table.Row": {
            cloned: true,
            defaultAction: "PRS",
            actions: {
                "TYP": [{
                    text: "On Selection-Area",
                    domChildWith: "-col0",
                    preferred: true,
                    order: 1
                }]
            }
        },
        "sap.m.SearchField": {
            defaultAction: [{
                domChildWith: "-search",
                action: "PRS"
            },
            {
                domChildWith: "-reset",
                action: "PRS"
            },
            {
                domChildWith: "",
                action: "TYP"
            }]
        }
    }

    // #region Control identification (i.e., from DOM, parents, children)

    /**
     * Retrieve the UI5 control for the given DOM node (i.e., HTML element)
     *
     * @param {HTMLElement} oDOMNode a DOM node (e.g., selected in UI)
     *
     * @returns {sap.ui.core.Element} the UI5 element associated with the given DOM node
     *
     * @see sap/ui/dom/jquery/control-dbg.js
     */
    static getControlFromDom(oDOMNode) {
        // predefine resulting element ID
        var sResultID;

        // traverse up in the DOM tree until finding a proper UI5 control,
        // starting with the given DOM node
        var oCurrentCandidate = oDOMNode;
        do {
            // if the current candidate has an attribute 'data-sap-ui-related',
            // its content directly mentions the control's ID
            if (oCurrentCandidate.hasAttribute("data-sap-ui-related")) {
                sResultID = oCurrentCandidate.getAttribute("data-sap-ui-related");
                break;
            }

            // if the current candidate has an attribute 'data-sap-ui', the
            // attribute 'id' is the control's ID that we search for
            if (oCurrentCandidate.hasAttribute("data-sap-ui")) {
                sResultID = oCurrentCandidate.getAttribute("id");
                break;
            }

            // check parent of current DOM element
            oCurrentCandidate = oCurrentCandidate.parentNode;

        } while (oCurrentCandidate); // break if there is no candidate left

        // if we traverse all candidates and do not find a UI5 control, we return here
        if (!sResultID) {
            return null;
        }

        // obtain and return UI5 control by the ID we found
        return sap.ui.getCore().byId(sResultID);
    }

    static _getAllChildrenOfDom(oDom, oControl) {
        var aChildren = $(oDom).children();
        var aReturn = [];
        for (var i = 0; i < aChildren.length; i++) {
            var aControl = $(aChildren[i]).control();
            if (aControl.length === 1 && aControl[0].getId() === oControl.getId()) {
                aReturn.push(aChildren[i]);
                aReturn = aReturn.concat(UI5ControlHelper._getAllChildrenOfDom(aChildren[i], oControl));
            }
        }
        return aReturn;
    }

    static getOwnerComponent(oItem) {
        var sCurrentComponent = "";
        while (oItem && oItem.getParent) {
            if (oItem.getController && oItem.getController() && oItem.getController().getOwnerComponent && oItem.getController().getOwnerComponent()) {
                sCurrentComponent = oItem.getController().getOwnerComponent().getId();
                break;
            }
            oItem = oItem.getParent();
        }
        return sCurrentComponent;
    }

    static getParentControlAtLevel(oItem, iLevel, bViewOnly) {
        oItem = oItem.getParent();
        while (oItem && oItem.getParent) {
            if (oItem.getMetadata && oItem.getMetadata().getElementName) { //dom is not required, but it must be a valid element name
                iLevel = iLevel - 1;
                if (bViewOnly === true && !oItem.getViewData) {
                    oItem = oItem.getParent();
                    continue;
                }
                if (iLevel <= 0) {
                    return oItem;
                }
            }
            oItem = oItem.getParent();
        }
        return null;
    }

    // #endregion

    static getUi5Id(oItem) {
        var sCurrentComponent = "";

        //remove all component information from the control
        var oParent = oItem;
        while (oParent && oParent.getParent) {
            if (oParent.getController && oParent.getController() && oParent.getController().getOwnerComponent && oParent.getController().getOwnerComponent()) {
                sCurrentComponent = oParent.getController().getOwnerComponent().getId();
                break;
            }
            oParent = oParent.getParent();
        }

        var sId = oItem.getId();

        if (!sCurrentComponent.length) {
            return sId;
        }

        sCurrentComponent = sCurrentComponent + "---";
        if (sId.lastIndexOf(sCurrentComponent) !== -1) {
            return sId.substr(sId.lastIndexOf(sCurrentComponent) + sCurrentComponent.length);
        }
        return sId;
    }

    static getUi5LocalId(oItem) {
        var sId = oItem.getId();

        if (sId.lastIndexOf("-") !== -1) {
            return sId.substr(sId.lastIndexOf("-") + 1);
        }

        return sId;
    }

    // #region Contexts and binding contexts

    static getBindingInformation(oItem, sBinding) {
        var oBindingInfo = oItem.getBindingInfo(sBinding);
        var oBinding = oItem.getBinding(sBinding);
        var oReturn = {};
        if (!oBindingInfo) {
            return oReturn;
        }

        //not really perfect for composite bindings (what we are doing here) - we are just returning the first for that..
        //in case of a real use case --> enhance
        var oRelevantPart = oBindingInfo;

        if (oBindingInfo.parts && oBindingInfo.parts.length > 0) {
            oRelevantPart = oBindingInfo.parts[0];
        }

        //get the binding context we are relevant for..
        var oBndgContext = oItem.getBindingContext(oRelevantPart.model);
        var sPathPre = oBndgContext ? oBndgContext.getPath() + "/" : "";

        if (oBinding) {
            oReturn = {
                model: oRelevantPart.model,
                path: oBinding.sPath && oBinding.getPath(),
                relativePath: oBinding.sPath && oBinding.getPath(), //relative path..
                contextPath: sPathPre,
                static: oBinding.oModel && oBinding.getModel() instanceof sap.ui.model.resource.ResourceModel,
                jsonBinding: oBinding.oModel && oBinding.getModel() instanceof sap.ui.model.json.JSONModel
            };

            oReturn.path = sPathPre + oReturn.path;
        } else {
            oReturn = {
                path: oBindingInfo.path,
                model: oRelevantPart.model,
                static: true
            };
        }
        return oReturn;
    }

    static getBindingContextInformation(oItem, sModel) {
        var oCtx = oItem.getBindingContext(sModel === "undefined" ? undefined : sModel);
        if (!oCtx) {
            return null;
        }

        return oCtx.getPath();
    }

    static getContextModels(oItem) {
        var oReturn = {};

        if (!oItem) {
            return oReturn;
        }

        var oModel = {};
        oModel = $.extend(true, oModel, oItem.oModels);
        oModel = $.extend(true, oModel, oItem.oPropagatedProperties.oModels);

        return oModel;
    }

    // TODO: missing: get elements with same parent, to get elements "right next", "left" and on same level
    static getContexts(oItem) {
        var oReturn = {};

        if (!oItem) {
            return oReturn;
        }

        var oModel = UI5ControlHelper.getContextModels(oItem);

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
    }

    // #endregion

    // #region Item objects

    static getLabelForItem(oItem) {

        function _getAllLabels() {

            if (TestItem._oTestGlobalCache.label) {
                return TestItem._oTestGlobalCache.label;
            }

            TestItem._oTestGlobalCache.label = {};
            var oCoreObject = null;
            var fakePlugin = {
                startPlugin: function (core) {
                    oCoreObject = core;
                    return core;
                }
            };
            sap.ui.getCore().registerPlugin(fakePlugin);
            sap.ui.getCore().unregisterPlugin(fakePlugin);

            var aElements = {};
            if (sap.ui.core.Element && sap.ui.core.Element.registry) {
                aElements = sap.ui.core.Element.registry.all();
            } else {
                aElements = oCoreObject.mElements;
            }


            for (var sCoreObject in aElements) {
                var oObject = aElements[sCoreObject];
                if (oObject.getMetadata()._sClassName === "sap.m.Label") {
                    var oLabelFor = oObject.getLabelFor ? oObject.getLabelFor() : null;
                    if (oLabelFor) {
                        TestItem._oTestGlobalCache.label[oLabelFor] = oObject; //always overwrite - i am very sure that is correct
                    } else {
                        //yes.. labelFor is maintained in one of 15 cases (fuck it)
                        //for forms it seems to be filled "randomly" - as apparently no developer is maintaing that correctly
                        //we have to search UPWARDS, and hope we are within a form.. in that case, normally we can just take all the fields aggregation elements
                        if (oObject.getParent() && oObject.getParent().getMetadata()._sClassName === "sap.ui.layout.form.FormElement") {
                            //ok.. we got luck.. let's assign all fields..
                            var oFormElementFields = oObject.getParent().getFields();
                            for (var j = 0; j < oFormElementFields.length; j++) {
                                if (!TestItem._oTestGlobalCache.label[oFormElementFields[j].getId()]) {
                                    TestItem._oTestGlobalCache.label[oFormElementFields[j].getId()] = oObject;
                                }
                            }
                        }
                    }
                }
            }

            //most simple approach is done.. unfortunatly hi
            return TestItem._oTestGlobalCache.label;
        }

        var aItems = _getAllLabels();
        return (aItems && aItems[oItem.getId()]) ? aItems[oItem.getId()] : null;
    }

    static getItemDataForItem(oItem) {
        //(0) check if we are already an item - no issue then..
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
        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
        /*@Adrian - Start
        var oPrt = _getParentWithDom(oItem, 3);
        if (oPrt && oPrt.getMetadata().getElementName() === "sap.m.MultiComboBox") {
            if (oPrt._getItemByListItem) {
                var oCtrl = oPrt._getItemByListItem(oItem);
                if (oCtrl) {
                    return oCtrl;
                }
            }
        }
          @Adrian - End*/
        var iIndex = 1;
        var oPrt = oItem;
        while (oPrt) {
            oPrt = UI5ControlHelper.getParentControlAtLevel(oItem, iIndex);
            iIndex += 1;

            if (iIndex > 100) { //avoid endless loop..
                return null;
            }

            if (oPrt && oPrt.getMetadata().getElementName() === "sap.m.MultiComboBox") {
                if (oPrt._getItemByListItem) {
                    var oCtrl = oPrt._getItemByListItem(oItem);
                    if (oCtrl) {
                        return oCtrl;
                    }
                }
            }
        }

        return null;
    }

    // #endregion

    // #region Miscellaneous

    static _getMergedControlClassArray(oItem) {

        function __getControlClassArray(oItem) {
            var oMetadata = oItem.control.getMetadata();
            var aReturn = [];
            while (oMetadata) {
                if (!oMetadata._sClassName) {
                    break;
                }
                if (UI5ControlHelper._oElementMix[oMetadata._sClassName]) {
                    aReturn.unshift(UI5ControlHelper._oElementMix[oMetadata._sClassName]);
                }
                oMetadata = oMetadata.getParent();
            };
            return $.extend(true, [], aReturn);
        }

        var aClassArray = __getControlClassArray(oItem);
        var oReturn = {
            defaultAction: {
                "": ""
            },
            askForBindingContext: false,
            preferredProperties: [],
            cloned: false,
            actions: {}
        };
        //merge from button to top (while higher elements are overwriting lower elements)
        for (var i = 0; i < aClassArray.length; i++) {
            var oClass = aClassArray[i];
            oReturn.actions = oReturn.actions ? oReturn.actions : [];
            if (!oClass.defaultAction) {
                oClass.defaultAction = [];
            } else if (typeof oClass.defaultAction === "string") {
                oClass.defaultAction = [{
                    domChildWith: "",
                    action: oClass.defaultAction
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
                        var aExisting = oReturn.actions[sAction].filter(function (e) {
                            return e.domChildWith === oClass.actions[sAction][j].domChildWith;
                        });
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
    }

    // #endregion
}

// #endregion

// #region Utility functions

// #endregion

// Finished setting up the coding now check if UI5 is loaded on the page.
console.log("- UI5-Testrecorder code appended");
test();
