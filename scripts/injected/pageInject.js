(function () {

"use strict";

// #region Page communication

/**
* PageCommunication class to handle any page–extension messaging.
*
* This class is singleton to ensure reliable message handling in both directions.
*
* Messages are handled using a {@link window.message} and corresponding listeners.
*/
class PageCommunication {

    /**
     * Obtain the singleton instance of this class.
     *
     * @returns {PageCommunication} the singleton instance
     */
    static getInstance() {
        if (!PageCommunication._oInstance) {
            PageCommunication._oInstance = new PageCommunication();
        }

        return PageCommunication._oInstance;
    }

    /**
     * Start connection by opening ports and application of listeners.
     */
    start() {
        // add listener for incoming messages
        window.addEventListener("message", this._messageFromExtension.bind(this));
    }

    /**
     * Send message from page.
     *
     * @param {string} sType the message type/label
     * @param {object} oData the data of the message
     * @param {integer} iMessageID the message ID to reply to (optional)
     */
    messageFromPage(sType, oData, iMessageID = null) {
        window.postMessage({
            origin: "FROM_PAGE",
            messageID: iMessageID,
            type: sType,
            data: oData
        });
    }

    /**
     * Message listener for messages *for* the page.
     *
     * @param {string} oMessage the incoming message
     */
    _messageFromExtension(oMessage) {
        //We only accept messages from ourselves
        if (oMessage.source !== window) {
            return;
        }

        if (event.data.type && (event.data.origin === "FROM_EXTENSION")) {
            console.log("Page injection received message: ");
            console.log("- type: " + oMessage.data.type);
            console.log("- data: " + JSON.stringify(oMessage.data.data));

            this._handleIncomingMessage(oMessage);
        }
    }

    /**
     * Handle detailed incoming messages.
     *
     * @param {object} oMessage a detailed message to handle
     */
    _handleIncomingMessage(oMessage) {
        console.debug("Find suitable event handling strategy for event: %o", oMessage);

        // unpack message data
        var sEventType = oMessage.data.type;
        var iMessageID = oMessage.data.messageID;
        var oEventData = oMessage.data.data;

        // execute event action based on type and gather return value
        var oReturn = {};
        switch (sEventType) {
            case "startRecording":
                oReturn = _startRecording(oEventData);
                break;

            case "stopRecording":
                oReturn = _stopRecording();
                break;

            case "findItemsBySelector":
                oReturn = _findItemsBySelector(oEventData);
                break;

            case "executeAction":
                oReturn = _executeAction(oEventData);
                break;

            case "getWindowInfo":
                oReturn = _getWindowInfo();
                break;

            // case "selectItem":
            //     this._selectItem(oEventData);
            //     break;
            // case "runSupportAsssistant":
            //     return this._runSupportAssistant(oEventData);
            // case "mockserver":
            //     return this._getDataModelInformation();

            // events that are not handled: "setWindowLocation", "unlock"/"unlockScreen"

            default:
                break;
        }

        if (!oReturn) {
            oReturn = {};
        }

        // send word that the action has been executed
        PageCommunication.getInstance().messageFromPage(sEventType, oReturn, iMessageID);
    }
}

function _startRecording(oInformation) {
    // start recording
    _bActive = true;
    _bStarted = true;

    lockScreen(); // we are locked until the next step occurs, or the overall test is stopped..

    // unhighlight any previously selected DOM nodes
    revealDOMNode(null);

    if (oInformation && oInformation.startImmediate === true) {
        if (!oLastDom && oInformation.domId) {
            oLastDom = document.getElementById(oInformation.domId);
        }
        if (!oLastDom) {
            oLastDom = document.activeElement;
        }

        //Directly select again (woop)
        // TODO rework as Promise or async function!
        setTimeout(function () {
            PageListener.getInstance().handleClickOn(oLastDom);
            oLastDom = null;
            this._bActive = false;
        }.bind(this), 10);
    }

}

function _stopRecording() {
    _bActive = false;
    _bStarted = false;

    // remove all DOM-node highlights
    revealDOMNode(null);
}

function _findItemsBySelector(oSelector) {
    // TODO create and use TestItem instance here
    return TestItem.findItemsBySelector(oSelector);
}

function _executeAction(oEventData) {
    // make screen available again
    unlockScreen();

    // get element and DOM node from event data
    var oItem = oEventData.element;
    var oDOMNode = UI5ControlHelper.getDomForControl(oItem);

    // reveal DOM node by using CSS classes and add fade-out effect
    revealDOMNode(oDOMNode);
    setTimeout(function () {
        revealDOMNode(null);
    }, 500);

    // for mouse-press events
    if (oItem.property.actKey === "PRS") {

        //send touch event..
        var event = new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        event.originalEvent = event; //self refer
        oDOMNode.dispatchEvent(event);

        var event = new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        event.originalEvent = event; //self refer
        oDOMNode.dispatchEvent(event);

        var event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        event.originalEvent = event; //self refer
        oDOMNode.dispatchEvent(event);

    } else
    // for typing events
    if (oItem.property.actKey === "TYP") {

        var sText = oItem.property.selectActInsert;
        oDOMNode.focus();
        if (sText.length > 0 && oItem.property.actionSettings.replaceText === false) {
            oDOMNode.val(oDOMNode.val() + sText);
        } else {
            oDOMNode.val(sText);
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
        oDOMNode.dispatchEvent(event);

        //afterwards trigger the blur event, in order to trigger the change event (enter is not really the same.. but ya..)
        if (oItem.property.actionSettings.blur === true) {
            var event = new MouseEvent('blur', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            event.originalEvent = event;
            oDOMNode.dispatchEvent(event);
        }

        if (oItem.property.actionSettings.enter === true) {
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
            oDOMNode.dispatchEvent(event);
        }
    }
}

function _getWindowInfo() {
    return {
        title: document.title,
        url: window.location.href,
        hash: window.location.hash,
        ui5Version: sap.ui.version
    };
}

// #endregion

// #region Page listener

class PageListener {

    /**
     * Obtain the singleton instance of this class.
     *
     * @returns {PageListener} the singleton instance
     */
    static getInstance() {
        if (!PageListener._oInstance) {
            PageListener._oInstance = new PageListener();
        }

        return PageListener._oInstance;
    }

    setupPageListener() {
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

        document.addEventListener("mousedown", function (event) {
            if (event.button == 2) {
                oLastDom = event.target;
            }
        }, true);

        // FIXME event prevention does not work properly (see also above): use addEventListener instead?
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
            this.handleClickOn(el);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }.bind(this);

        sap.m.MessageToast.show("UI5-Testrecorder fully injected!");
    }

    handleClickOn(oDOMNode) {

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

        // reveal DOM node by using CSS classes
        revealDOMNode(oDOMNode);

        // send control to extension for testing:
        // 0) construct test item
        var oTestItem = new TestItem(oControl, oDOMNode, oOriginalDomNode);
        // 1) enhance with meta data
        oTestItem.initializeTestItem();
        // 3) send item to extension
        PageCommunication.getInstance().messageFromPage("itemSelected", oTestItem.getData());

        // lock screen to indicate switch to extension
        lockScreen();
    }
}

// #endregion

// #region class TestItem

/**
 * TestItem class.
 *
 * There are three steps to perform:
 * 1. Construct a new object.
 * 2. Call .initializeTestItem() on object.
 * 3. Call .getData() on object to retrieve initialized item.
 *
 * @constructor
 * @param {sap.ui.core.Element} oControl the UI5 control to handle
 * @param {HTMLElement} oDOMNode the corresponding selected DOM node
 * @param {HTMLElement} oOriginalDOMNode the DOM node that has been initially selected on the site
 */
class TestItem {

    /**
     * Resets the static variable {@link _oTestGlobalCache}.
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

        // correct original DOM not if not existing
        this._oOriginalDOMNode = this._oOriginalDOMNode ? this._oOriginalDOMNode : this._oDOMNode;

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

        // enrich with element information
        var oItem = TestItem._getElementInformation(this._oControl, this._oDOMNode);

        // enrich with uniqueness information
        oItem = TestItem._setUniqunessInformationElement(oItem);

        // save original DOM-node ID to identifier information
        oItem.identifier.domIdOriginal = this._oOriginalDOMNode.id;

        // enrich with information on child nodes within same control
        var aChildNodes = UI5ControlHelper.getAllChildrenOfDom(oItem.control.getDomRef(), oItem.control);
        oItem.children = aChildNodes.map(function (oChild) {
            return {
                isInput: ["input", "textarea"].indexOf(oChild.tagName.toLowerCase()),
                domChildWith: oChild.id.substr(oItem.control.getId().length)
            }
        });

        // enrich with information on all parent nodes
        oItem.parents = [];
        var oItemCur = UI5ControlHelper.getParentControlAtLevel(oItem.control, 1);
        while (oItemCur) {
            // only add current item as parent if we get a DOM reference
            if (oItemCur.getDomRef && oItemCur.getDomRef()) {
                oItem.parents.push(TestItem._getElementInformation(oItemCur, oItemCur.getDomRef(), false));
            }

            // go to next parent
            oItemCur = UI5ControlHelper.getParentControlAtLevel(oItemCur, 1);
        }

        // remove any non-serializable information, so we can send the item in a message
        oItem = TestItem._removeNonSerializable(oItem);

        this._testItem = oItem;
    }

    /**
     * Return inialized test-item data.
     *
     * @returns {Object} the initalized test-item data
     */
    getData() {
        if (!this._testItem) {
            console.log("Test item not initalized. Initializing now...");
            this.initializeItem();
        }

        return this._testItem;
    }

    // #region Item finding

    /**
     *
     * @param {*} oSelector
     */
    static findItemsBySelector(oSelector) {

        var sStringified = JSON.stringify(oSelector);

        var aInformation = [];
        if (!TestItem._oTestGlobalCache["findItem"][sStringified]) {
            TestItem._oTestGlobalCache["findItem"][sStringified] = UI5ControlHelper.findControlsBySelector(oSelector);
        }
        aInformation = TestItem._oTestGlobalCache["findItem"][sStringified];

        //remove all items, which are starting with "testDialog"..
        // TODO Is this needed anyway?! If yes: "!startWith" or "!includes"? "indexOf() === -1" is "!includes"...
        var aItems = aInformation.filter(function(oItem) {
            return oItem.getId().indexOf("testDialog") === -1;
        })

        var aItemsEnhanced = aItems.map(function(oItem) {
            return TestItem._removeNonSerializable(
                TestItem._getElementInformation(oItem, oItem.getDomRef(), true)
            );
        });

        return aItemsEnhanced;
    }

    // #endregion

    // #region Information retrieval

    /**
     * Obtains general information on the given control (available at the given DOM node).
     *
     * The data includes basically:
     * - UI5 IDs,
     * - metadata and component information.
     *
     * If {bFull === true}, the data is enhanced with the information on:
     * - parents,
     * - parents at levels 1–4,
     * - view,
     * - bindings and binding contexts,
     * - simple properties,
     * - label and item data.
     *
     * The data is obtained recursively (where applicable) and cached for easier and faster retrieval.
     *
     * @param {*} oControl the UI5 control to obtain information for
     * @param {*} oDOMNode the DOM node of the UI5 control
     * @param {*} bFull flag whether to obtain full information (see above)
     *
     * @returns {object} an object containing the listed information
     */
    static _getElementInformation(oControl, oDOMNode, bFull = true) {

        /**
         * Obtains detailed information on the given control (available at the given DOM node).
         *
         * The data includes basically:
         * - UI5 IDs,
         * - metadata and component information.
         *
         * If {bFull === true}, the data is enhanced with the information on:
         * - parents,
         * - parents at levels 1–4,
         * - view,
         * - bindings and binding contexts, and
         * - simple properties.
         *
         * The data is cached for easier and faster retrieval.
         *
         * @param {*} oControl the UI5 control to obtain information for
         * @param {*} oDOMNode the DOM node of the UI5 control
         * @param {*} bFull flag whether to obtain full information (see above)
         *
         * @returns {object} an object containing the listed information
         */
        function getElementInformationDetails(oItem, oDomNode, bFull = true) {

            // construct default return value
            var oReturn = {
                property: {},
                aggregation: {},
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

            // no item to inspect, return right away
            if (!oItem) {
                return oReturn;
            }

            // check cache to return potentially existing cached result
            if (TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()]) {
                return TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()];
            }

            // if DOM node is not defined, use DOM reference of the item as a start
            if (!oDomNode && oItem.getDomRef) {
                oDomNode = oItem.getDomRef();
            }

            // store default information and UI5 IDs
            oReturn.control = oItem;
            oReturn.dom = oDomNode;
            oReturn.identifier.domId = oDomNode.id;
            oReturn.identifier.ui5Id = UI5ControlHelper.getUi5Id(oItem);
            oReturn.identifier.ui5LocalId = UI5ControlHelper.getUi5LocalId(oItem);
            oReturn.identifier.ui5AbsoluteId = oItem.getId();

            // get class names from metadata
            oReturn.classArray = [];
            var oMeta = oItem.getMetadata();
            while (oMeta) {
                oReturn.classArray.push({ elementName: oMeta._sClassName });
                oMeta = oMeta.getParent();
            }

            // identify whether the element has been cloned:
            // 1) if the UI5 ID contains a "-" with a following number, it is most likely a dependent control (e.g., based on aggregation or similar) and, thus, cloned
            if (RegExp("([A-Z,a-z,0-9])-([0-9])").test(oReturn.identifier.ui5Id)) {
                oReturn.identifier.idCloned = true;
            }
            // 2) check via metadata
            else {
                var oMetadata = oItem.getMetadata();
                while (oMetadata) {
                    // if there is no class name available, we can stop searching
                    if (!oMetadata._sClassName) {
                        break;
                    }

                    // item is cloned if it is an Item, a Row, or an ObjectListItem
                    if (["sap.ui.core.Item", "sap.ui.table.Row", "sap.m.ObjectListItem"].includes(oMetadata._sClassName)) {
                        oReturn.identifier.idCloned = true;
                    }

                    oMetadata = oMetadata.getParent();
                }
            }

            // identify whether the element ID has been generated:
            // if the ui5id contains a "__", it is most likely a generated ID which should NOT BE USESD LATER!
            // TODO check might be enhanced, as it seems to be that all controls are adding "__[CONTORLNAME] as dynamic view..
            if (oReturn.identifier.ui5Id.includes("__")) {
                oReturn.identifier.idGenerated = true;
            }

            // identify whether the local element ID is cloned or generated
            if (oReturn.identifier.idCloned || oReturn.identifier.ui5LocalId.includes("__")) {
                oReturn.identifier.localIdClonedOrGenerated = true;
            }

            // get metadata:
            // 1) basic information and structure
            oReturn.metadata = {
                elementName: oItem.getMetadata().getElementName(),
                componentName: UI5ControlHelper.getOwnerComponent(oItem),
                componentId: "",
                componentTitle: "",
                componentDescription: "",
                componentDataSource: {}
            };
            // 2) enhance component information
            var oComponent = sap.ui.getCore().getComponent(oReturn.metadata.componentName);
            if (oComponent) {
                // get manifest of component
                var oManifest = oComponent.getManifest();

                if (oManifest && oManifest["sap.app"]) {
                    // get the app from manifest
                    var oApp = oManifest["sap.app"];

                    // store app metadata in return value
                    oReturn.metadata.componentId = oApp.id;
                    oReturn.metadata.componentTitle = oApp.title;
                    oReturn.metadata.componentDescription = oApp.description;

                    // get component data sources (only OData)
                    if (oApp.dataSources) {
                        for (var sDs in oApp.dataSources) {
                            var oDS = oApp.dataSources[sDs];

                            // skip any non-OData sources as only those are relevant
                            if (oDS.type !== "OData") {
                                continue;
                            }

                            // store data source in return value
                            oReturn.metadata.componentDataSource[sDs] = {
                                uri: oDS.uri,
                                localUri: (oDS.settings && oDS.settings.localUri) ? oDS.settings.localUri : ""
                            };
                        }
                    }
                }
            }

            // if we do not perform a full retrieval, we can cache now and return
            if (bFull === false) {
                TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()] = oReturn;
                return oReturn;
            }

            // get view information
            var oView = UI5ControlHelper.getParentControlAtLevel(oItem, 1, true); // get the view!
            if (oView && oView.getProperty("viewName")) {
                oReturn.viewProperty.viewName = oView.getProperty("viewName");
                oReturn.viewProperty.localViewName = oReturn.viewProperty.viewName.split(".").pop();
                if (oReturn.viewProperty.localViewName.length) {
                    oReturn.viewProperty.localViewName = oReturn.viewProperty.localViewName.charAt(0).toUpperCase() + oReturn.viewProperty.localViewName.substring(1);
                }
            }

            // get binding information
            // 1) all bindings
            for (var sBinding in oItem.mBindingInfos) {
                oReturn.binding[sBinding] = UI5ControlHelper.getBindingInformation(oItem, sBinding);
            }
            // 2) special binding information for "sap.m.Label" if not existing already
            if (oReturn.metadata.elementName === "sap.m.Label" && !oReturn.binding.text) {
                // if the label is part of a FormElement, we may obtain further binding information based on the parent
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

            // get binding contexts
            for (var sModel in  UI5ControlHelper.getContextModels(oItem)) {
                var oBndg = UI5ControlHelper.getBindingContextInformation(oItem, sModel);
                if (!oBndg) {
                    continue;
                }
                oReturn.bindingContext[sModel] = oBndg;
            }

            // get all simple properties
            for (var sProperty in oItem.mProperties) {
                var fnGetter = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)];
                if (fnGetter) {
                    oReturn.property[sProperty] = fnGetter.call(oItem);
                } else {
                    oReturn.property[sProperty] = oItem.mProperties[sProperty];
                }
            }

            // get all binding contexts
            oReturn.context = UI5ControlHelper.getContexts(oItem);

            // get model information
            oReturn.model = {};

            // get lengths of aggregation
            var aAggregations = oItem.getMetadata().getAllAggregations();
            for (var sAggregation in aAggregations) {

                // if there are not multiple items aggregated, this is not interesting
                if (!aAggregations[sAggregation].multiple) {
                    continue;
                }

                // construct raw aggregation info
                var oAggregationInfo = {
                    rows: [],
                    filled: false,
                    name: sAggregation,
                    length: 0
                };

                // get data of current aggregation
                var aAggregationData = oItem["get" + sAggregation.charAt(0).toUpperCase() + sAggregation.substr(1)]();

                // check whether the aggregation data is filled
                if (typeof aAggregationData !== "undefined" && aAggregationData !== null) {
                    oAggregationInfo.filled = true;
                    oAggregationInfo.length = aAggregationData.length;
                }

                // for every single line in aggregation data, get the binding context and UI5 IDs
                oAggregationInfo.rows = aAggregationData.map(function(oAggregationRow) {
                    return {
                        context: UI5ControlHelper.getContexts(oAggregationRow),
                        ui5Id: UI5ControlHelper.getUi5Id(oAggregationRow),
                        ui5AbsoluteId: oAggregationRow.getId()
                    };
                });

                // store aggregation information by name
                oReturn.aggregation[oAggregationInfo.name] = oAggregationInfo;
            }

            // cache element information
            TestItem._oTestGlobalCache["fnGetElement"][bFull][oItem.getId()] = oReturn;

            return oReturn;
        }

        // check cache to return potentially existing cached result
        if (TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()]) {
            return TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()];
        }

        // construct raw return value
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

        // if there is no control given, return empty information object
        if (!oControl) {
            return oReturn;
        }

        // get detailed information on given control
        oReturn = deepExtend(oReturn, getElementInformationDetails(oControl, oDOMNode, bFull));

        // if we do not perform a full retrieval, we can cache now and return
        if (bFull === false) {
            TestItem._oTestGlobalCache["fnGetElementInfo"][bFull][oControl.getId()] = oReturn;
            return oReturn;
        }

        // get information on all parents
        oReturn.parent = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 1), bFull);
        oReturn.parentL2 = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 2), bFull);
        oReturn.parentL3 = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 3), bFull);
        oReturn.parentL4 = getElementInformationDetails(UI5ControlHelper.getParentControlAtLevel(oControl, 4), bFull);

        // get information on label and item data
        oReturn.label = getElementInformationDetails(UI5ControlHelper.getLabelForItem(oControl), bFull);
        oReturn.itemdata = getElementInformationDetails(UI5ControlHelper.getItemDataForItem(oControl), bFull);

        // cache result
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
                    if (!bFound) {
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

/**
 * Global control cache for easier retrieval of visited controls.
 *
 * @see _resetCache initialization
 */
TestItem._oTestGlobalCache = null;

// #endregion

// #region UI5ControlHelper

class UI5ControlHelper {

    // #region Control identification (i.e., from DOM, parents, children)

    /**
     * Retrieves the fully initialized instance of the current SAPUI5 Core (and not only its interface).
     *
     * Using the returned element, it is possible to retrieve all registered UI5 elements (see {UI5ControlHelper.getRegisteredElements}) before UI5 v1.67.
     *
     * @returns {sap.ui.core.Core} the fully initialized Core instance
     *
     * @see UI5ControlHelper.getRegisteredElements
     *
     * @license CC-BY-SA-4.0 <https://creativecommons.org/licenses/by-sa/4.0/>
     * @see https://stackoverflow.com/a/44510152
     */
    static getInitializedCore() {
        var oCoreObject;

        // construct fake plugin to retrieve initialized core
        var fakePlugin = {
            startPlugin: function (core) {
                oCoreObject = core;
                return core;
            }
        };

        // register plugin to retrieve core and unregister it immediately
        sap.ui.getCore().registerPlugin(fakePlugin);
        sap.ui.getCore().unregisterPlugin(fakePlugin);

        return oCoreObject;
    }

    /**
     * Retrieves all registered UI5 elements from the Core object.
     *
     * @returns {Object.<sap.ui.core.ID, sap.ui.core.Element>} object with all registered elements, keyed by their ID
     */
    static getRegisteredElements() {
        var oElements = {};

        // try to use registry (UI5 >= v1.67)
        if (sap.ui.core.Element && sap.ui.core.Element.registry) {
            oElements = sap.ui.core.Element.registry.all();
        }
        // use workaround with fully initialized core otherwise
        else {
            oElements = UI5ControlHelper.getInitializedCore().mElements;
        }

        return oElements;
    }

    /**
     * Retrieves the UI5 control for the given DOM node (i.e., HTML element).
     *
     * @param {HTMLElement} oDOMNode a DOM node (e.g., selected in UI)
     *
     * @returns {sap.ui.core.Element} the UI5 controls associated with the given DOM node
     *
     * @see sap/ui/dom/jquery/control-dbg.js
     */
    static getControlFromDom(oDOMNode) {
        // predefine resulting element ID
        var sResultID;

        // TODO test this with LTS releases! (see version overview)
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

    /**
     * Retrieves the UI5 controls for the given DOM nodes (i.e., HTML elements).
     *
     * @param {Array} oDOMNodes an Array of DOM nodes
     *
     * @returns {Array(sap.ui.core.Element)} the UI5 controls associated with the given DOM nodes
     *
     * @see sap/ui/dom/jquery/control-dbg.js
     */
    static getControlsFromDom(oDOMNodes) {
        return oDOMNodes.map(UI5ControlHelper.getControlFromDom);
    }

    /**
     * Retrieves the HTML/DOM node for the given UI5 control data.
     *
     * @param {object} oControlData an object with UI5-control data
     *
     * @returns {HTMLNode} the DOM node associated with the given UI5 control
     */
    static getDomForControl(oControlData) {
        // check whether the given control is not embedded into another one
        var sExtension = oControlData.property.domChildWith;
        if (!sExtension.length) {
            return sap.ui.getCore().byId(oControlData.item.identifier.ui5AbsoluteId).getDomRef();
        }

        // return a default query for the combined ID
        var sIdSelector = "*[id$='" + (oControlData.item.identifier.ui5AbsoluteId + sExtension) + "']";
        return document.querySelector(sIdSelector);
    }

    /**
     * Returns all children of the given DOM node within the same UI5 control.
     *
     * @param {*} oDom the DOM node to inspect
     * @param {*} oControl the UI5 control of the DOM node
     *
     * @returns {Array} an array of the identified DOM nodes
     */
    static getAllChildrenOfDom(oDom, oControl) {

        // initialize return value
        var aReturn = [];

        // get all direct children of the current DOM node
        var aChildren = Array.prototype.slice.call(oDom.children);

        // for each child, get the control and check whether it matches the given one 'oControl';
        // if yes, check also all children of this DOM node
        for (var oChild of aChildren) {
            var oChildControl = UI5ControlHelper.getControlFromDom(oChild);
            if (oChildControl && oChildControl.getId() === oControl.getId()) {
                aReturn.push(oChild);
                aReturn = aReturn.concat(UI5ControlHelper.getAllChildrenOfDom(oChild, oControl));
            }
        }

        return aReturn;
    }

    static findControlsBySelector(oSelector) {

        // collect all string selectors
        var aSelectorStrings = [];

        if (typeof oSelector !== "string") {
            if (JSON.stringify(oSelector) == JSON.stringify({})) {
                return [];
            }

            var aElements = UI5ControlHelper.getRegisteredElements();

            // TODO can we reuse UI5ControlHelper.getLabelForItem._getAllLabels here?
            //search for identifier of every single object..
            for (var sElement in aElements) {

                var oItem = aElements[sElement];

                // check item itself
                if (!UI5ControlHelper.checkItemAgainstSelector(oItem, oSelector)) {
                    continue;
                }

                // check item match against various related components:
                // 1) check against label
                if (oSelector.label && !UI5ControlHelper.checkItemAgainstSelector(UI5ControlHelper.getLabelForItem(oItem), oSelector.label)) {
                    continue;
                }
                //  2) check parent levels
                if (oSelector.parent && !UI5ControlHelper.checkItemAgainstSelector(UI5ControlHelper.getParentControlAtLevel(oItem, 1), oSelector.parent)) {
                    continue;
                }
                if (oSelector.parentL2 && !UI5ControlHelper.checkItemAgainstSelector(UI5ControlHelper.getParentControlAtLevel(oItem, 2), oSelector.parentL2)) {
                    continue;
                }
                if (oSelector.parentL3 && !UI5ControlHelper.checkItemAgainstSelector(UI5ControlHelper.getParentControlAtLevel(oItem, 3), oSelector.parentL3)) {
                    continue;
                }
                if (oSelector.parentL4 && !UI5ControlHelper.checkItemAgainstSelector(UI5ControlHelper.getParentControlAtLevel(oItem, 4), oSelector.parentL4)) {
                    continue;
                }
                // 3) check item data
                if (oSelector.itemdata && !UI5ControlHelper.checkItemAgainstSelector(UI5ControlHelper.getItemDataForItem(oItem), oSelector.itemdata)) {
                    continue;
                }

                // if there is no DOM reference, we can continue
                if (!oItem.getDomRef()) {
                    continue;
                }

                // add DOM-reference query to selector strings
                var sDOMId = "*[id$='" + oItem.getDomRef().id + "']";
                aSelectorStrings.push(sDOMId);
            }

        } else {

            //our search for an ID is using "ends with", as we are using local IDs only (ignore component)
            //this is not really perfect for multi-component architecture (here the user has to add the component manually)
            //but sufficient for most approaches. Reason for removign component:
            //esnure testability both in standalone and launchpage enviroments
            if (oSelector.charAt(0) === '#') {
                oSelector = oSelector.substr(1); //remove the leading "#" if any
            }

            // add selector string as query to selector strings
            var sSearchId = "*[id$='" + oSelector + "']";
            aSelectorStrings.push(sSearchId);

        }

        // select DOM nodes based on selector strings
        var aDOMNodes = aSelectorStrings.map(function(sIdSelector) {
            return document.querySelector(sIdSelector);
        });

        // obtain controls for the DOM nodes
        var aItemsControls = UI5ControlHelper.getControlsFromDom(aDOMNodes);

        // if the result does not make sense or is no UI5 control, return empty
        if (!aDOMNodes || !aDOMNodes.length || !aItemsControls || !aItemsControls.length) {
            return [];
        }

        // return control for item
        return aItemsControls;
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

    // #region UI5 IDs

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

    // #endregion

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
        oModel = deepExtend(oModel, oItem.oModels, oItem.oPropagatedProperties.oModels);
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
            var aElements = UI5ControlHelper.getRegisteredElements();
            for (var sElement in aElements) {
                var oObject = aElements[sElement];
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

    /**
     * Check whether the item matchs with the given selector.
     *
     * @param {*} oItem
     * @param {*} oSelector
     *
     * @returns {boolean} true if the item matches the selector; false otherwise
     */
    static checkItemAgainstSelector(oItem, oSelector) {
        var bFound = true;
        if (!oItem) { //e.g. parent level is not existing at all..
            return false;
        }
        if (oSelector.metadata) {
            if (oSelector.metadata.elementName && oSelector.metadata.elementName !== oItem.getMetadata().getElementName()) {
                return false;
            }
            if (oSelector.metadata.componentName && oSelector.metadata.componentName !== UI5ControlHelper.getOwnerComponent(oItem)) {
                return false;
            }
        }

        if (oSelector.viewProperty) {
            var oView = UI5ControlHelper.getParentControlAtLevel(oItem, 1, true);
            if (!oView) {
                return false;
            }

            var sViewName = oView.getProperty("viewName");
            var sViewNameLocal = sViewName.split(".").pop();
            if (sViewNameLocal.length) {
                sViewNameLocal = sViewNameLocal.charAt(0).toUpperCase() + sViewNameLocal.substring(1);
            }

            if (oSelector.viewProperty.viewName && oSelector.viewProperty.viewName !== sViewName) {
                return false;
            }
            if (oSelector.viewProperty.localViewName && oSelector.viewProperty.localViewName !== sViewNameLocal) {
                return false;
            }
        }

        if (oSelector.domChildWith && oSelector.domChildWith.length > 0) {
            var oDomRef = oItem.getDomRef();
            if (!oDomRef) {
                return false;
            }
            if ($("*[id$='" + oDomRef.id + oSelector.domChildWith + "']").length === 0) {
                return false;
            }
        }

        if (oSelector.model) {
            for (var sModel in oSelector.model) {
                sModel = sModel === "undefined" ? undefined : sModel;
                if (!oItem.getModel(sModel)) {
                    return false;
                }
                for (var sModelProp in oSelector.model[sModel]) {
                    if (oItem.getModel(sModel).getProperty(sModelProp) !== oSelector.model[sModel][sModelProp]) {
                        return false;
                    }
                }
            }
        }

        if (oSelector.identifier) {
            if (oSelector.identifier.ui5Id && oSelector.identifier.ui5Id !== UI5ControlHelper.getUi5Id(oItem)) {
                return false;
            }
            if (oSelector.identifier.ui5LocalId && oSelector.identifier.ui5LocalId !== UI5ControlHelper.getUi5LocalId(oItem)) {
                return false;
            }
        }

        //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
        /*@Adrian - Start*/
        if (oSelector.bindingContext) {
            for (var sModel in oSelector.bindingContext) {
                var oCtx = oItem.getBindingContext(sModel === "undefined" ? undefined : sModel);
                if (!oCtx) {
                    return false;
                }

                if (oCtx.getPath() !== oSelector.bindingContext[sModel]) {
                    return false;
                }
            }
        }
        /*@Adrian - End*/
        if (oSelector.binding) {
            for (var sBinding in oSelector.binding) {
                //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                /*@Adrian - Start
                var oAggrInfo = oItem.getBindingInfo(sBinding);
                if (!oAggrInfo) {
                    //SPECIAL CASE for sap.m.Label in Forms, where the label is actually bound against the parent element (yay)
                    @Adrian - End*/
                /*@Adrian - Start*/

                var oBndgInfo = UI5ControlHelper.getBindingInformation(oItem, sBinding);

                if (oBndgInfo.path !== oSelector.binding[sBinding].path) {
                    /*@Adrian - End*/
                    if (oItem.getMetadata().getElementName() === "sap.m.Label") {
                        if (oItem.getParent() && oItem.getParent().getMetadata()._sClassName === "sap.ui.layout.form.FormElement") {
                            var oParentBndg = oItem.getParent().getBinding("label");
                            if (!oParentBndg || oParentBndg.getPath() !== oSelector.binding[sBinding].path) {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                    //@Adrian - Fix bnd-ctxt uiveri5 2019/06/25
                    /*@Adrian - Start
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
                    @Adrian - End*/
                }
            }
        }

        if (oSelector.aggregation) {
            for (var sAggregationName in oSelector.aggregation) {
                var oAggr = oSelector.aggregation[sAggregationName];
                if (!oAggr.name) {
                    continue; //no sense to search without aggregation name..
                }
                if (typeof oAggr.length !== "undefined") {
                    if (oItem.getAggregation(sAggregationName).length !== oAggr.length) {
                        bFound = false;
                    }
                }
                if (!bFound) {
                    return false;
                }
            }
        }
        if (oSelector.context) {
            for (var sModel in oSelector.context) {
                var oCtx = oItem.getBindingContext(sModel === "undefined" ? undefined : sModel);
                if (!oCtx) {
                    return false;
                }
                var oObjectCompare = oCtx.getObject();
                if (!oObjectCompare) {
                    return false;
                }
                var oObject = oSelector.context[sModel];
                for (var sAttr in oObject) {
                    if (oObject[sAttr] !== oObjectCompare[sAttr]) {
                        return false;
                    }
                }
            }
        }
        if (oSelector.property) {
            for (var sProperty in oSelector.property) {
                if (!oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]) {
                    //property is not even available in that item.. just skip it..
                    bFound = false;
                    break;
                }
                var sPropertyValueItem = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]();
                var sPropertyValueSearch = oSelector.property[sProperty];
                if (sPropertyValueItem !== sPropertyValueSearch) {
                    bFound = false;
                    break;
                }
            }
            if (!bFound) {
                return false;
            }
        }

        return true;
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
            }
            return aReturn;
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

/**
 * Default properties for common controls.
 */
UI5ControlHelper._oElementMix = {
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
};

// #endregion

// #region Utility functions

/**
 * Checks whether the object is a plain object (created using "{}" or "new Object").
 *
 * @param {Object} obj the object which is checked
 * @returns {Boolean} whether or not the object is a plain object (created using "{}" or "new Object")
 *
 * @see OpenUI5 module sap/base/util/isPlainObject
 */
function isPlainObject(obj) {
    /*
     * The code in this function is taken from OpenUI5 "isPlainObject" and got modified.
     *
     * OpenUI5 v1.72.4
     * https://openui5.org/
     *
     * Copyright OpenUI5 and other contributors
     * Released under the Apache-2.0 license
     * https://github.com/SAP/openui5/blob/master/LICENSE.txt
     *
     * Changes:
     * - inline variable declarations,
     * - remove unnecessary JSdoc strings, and
     * - adjust function declaration
     */

    // Detect obvious negatives
    // Use toString instead of jQuery.type to catch host objects
    if ( !obj || {}.toString.call( obj ) !== "[object Object]" ) {
        return false;
    }

    var proto = Object.getPrototypeOf( obj );

    // Objects with no prototype (e.g., `Object.create( null )`) are plain
    if ( !proto ) {
        return true;
    }

    // Objects with a prototype are considered plain only if they were constructed by a global Object function
    var Ctor = {}.hasOwnProperty.call( proto, "constructor" ) && proto.constructor;
    return typeof Ctor === "function" && {}.hasOwnProperty.toString.call( Ctor ) === {}.hasOwnProperty.toString.call( Object );
}

/**
 * Merge the contents of two or more objects recursively together into the first object.
 *
 * @param {*} target an object that will receive the new properties of additionally passed objects, an empty object by default
 *
 * @license MIT
 */
function deepExtend(target) {
    /**
     * The code in this function is taken from jQuery 3.4.1 "jQuery.extend" and got modified.
     * Furthermore, code from "You might not need jQuery" (deep extend) is used.
     *
     * jQuery JavaScript Library v3.4.1
     * https://jquery.com/
     *
     * Copyright jQuery Foundation and other contributors
     * Released under the MIT license
     * https://jquery.org/license
     *
     * You might not need jQuery
     * http://youmightnotneedjquery.com/#deep_extend
     *
     * Copyright HubSpot and other contributors
     * Released under the MIT license
     * https://github.com/HubSpot/youmightnotneedjquery/blob/gh-pages/LICENSE
     */

    // get target, empty object by default
    target = target || {};

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && typeof target !== "function") {
        target = {};
    }

    // define temporary variables
    var key, obj, src, copy, clone;

    // get properties of all further arguments
    for (var i = 1; i < arguments.length; i++) {
        obj = arguments[i];

        // ignore any non-object arguments
        if (!obj) {
            continue;
        }

        // loop over all properties of current object
        for (key in obj) {

            src = target[key];
            copy = obj[key];

            // skip undefined values, overriding the same value, and the __proto__ key
            if (copy === undefined || target === copy || key === "__proto__") {
                continue;
            }

            // recurse if merging plain objects or arrays
            if (copy && ($.isPlainObject(copy) || Array.isArray(copy))) {

                if (Array.isArray(copy)) {
                    clone = src && Array.isArray(src) ? src : [];
                } else {
                    clone = src && $.isPlainObject(src) ? src : {};
                }

                // Never move original objects, clone them
                target[key] = deepExtend(clone, copy);

            } else {
                // override anything else
                target[key] = copy;
            }

        }
    }

    return target;
}

// #endregion

// #region Record handling

var _bActive = false,
    _bScreenLocked = false,
    _bStarted = false,
    _oDialog = null,
    oLastDom = null;

function lockScreen() {
    // TODO show a DIV element with high z-index to block complete screen!
    _bScreenLocked = true;
}

function unlockScreen() {
    _bScreenLocked = false;
}

/**
 * Highlight the given DOM element of a control on the site using CSS classes.
 *
 * @param {HTMLElement} oDOMNode the corresponding selected DOM node
 */
function revealDOMNode(oDOMNode) {
    // 1) remove all previously enabled highlightings
    var prevFoundElements = document.getElementsByClassName("UI5TR_ControlFound");
    Array.prototype.forEach.call(prevFoundElements, function (oElement) {
        oElement.classList.remove("UI5TR_ControlFound");
        oElement.classList.remove("UI5TR_ControlFound_InlineFix");
    });

    // 2) do not add CSS classes if there is no DOM node
    if (!oDOMNode) {
        return;
    }

    // 2) highlight the new element
    oDOMNode.classList.add("UI5TR_ControlFound");

    // 3) ensure that class is displayed properly (e.g., DIV elements with 'display: inline'
    // do not display background)
    if (window.getComputedStyle(oDOMNode)["display"] === "inline") {
        oDOMNode.classList.add("UI5TR_ControlFound_InlineFix");
    }
}

// #endregion

// #region Initialization

function checkPageForUI5() {
    var oData = {};
    if (window.sap && window.sap.ui) {
        oData.status = "success";

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
        oData.status = "error";
    }
    return oData;
}

function initializePage() {

    console.log('- checking UI5 appearance...');
    const maxWaitTime = 3000;
    var waited = 0;
    var intvervalID = setInterval(function () {
        waited = waited + 100;
        if (waited % 500 === 0) {
            console.log('- checking UI5 appearance...');
        }
        var oCheckData = checkPageForUI5();
        if (oCheckData.status === "success") {
            clearInterval(intvervalID);
            setupTestRecorderFunctions();
            PageCommunication.getInstance().messageFromPage("injectDone", oCheckData);
        } else if (waited > maxWaitTime) {
            clearInterval(intvervalID);
            PageCommunication.getInstance().messageFromPage("injectDone", oCheckData);
        }
    }, 100);
}

function setupTestRecorderFunctions() {
    //setup listener for messages from the Extension
    PageCommunication.getInstance().start();
    PageListener.getInstance().setupPageListener();
}

// Finished setting up the coding now check if UI5 is loaded on the page.
console.log("- UI5-Testrecorder code appended");
initializePage();

// #endregion

}());
