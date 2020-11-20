
var _wnd = window;

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
            this._messageFromExtensionBind = this._messageFromExtension.bind(this);
            window.addEventListener("message", this._messageFromExtensionBind);
        }

        /**
         * Reset connection by removing listeners.
         */
        reset() {
            window.removeEventListener("message", this._messageFromExtensionBind);
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

                case "findElementIDsBySelector":
                    oReturn = _findElementIDsBySelector(oEventData);
                    break;

                case "selectItem":
                    oReturn = _selectItem(oEventData);
                    break;

                case "checkAction":
                    // check preconditions for action
                    oReturn = _checkAction(oEventData);
                    break;

                case "executeAction":
                    // execute action synchronously
                    oReturn = _executeAction(oEventData);
                    // package return value for this action to trigger correct handling in replay functionality
                    oReturn.type = "ACT";
                    break;

                case "executeAssert":
                    // execute action synchronously (no return value)
                    oReturn = _executeAssert(oEventData);
                    // package return value for this action to trigger correct handling in replay functionality
                    oReturn.type = "ASS";
                    break;

                case "getWindowInfo":
                    oReturn = _getWindowInfo();
                    break;

                case "runSupportAssistant":
                    oReturn = _runSupportAssistant(oEventData);
                    break;

                case "lockPage":
                    oReturn = lockPage();
                    break;

                case "unlockPage":
                    oReturn = unlockPage();
                    break;

                case "disconnect":
                    oReturn = _disconnect();
                    return; // return directly and do not issue any returning message below

                case "getODataV2Models":
                    oReturn = _retrieveODataV2Models();
                    break;

                case "checkRootComponent":
                    oReturn = _checkRootComponent();
                    break;

                default:
                    break;
            }

            if (!oReturn) {
                oReturn = {};
            }

            // send word that the action has been executed:
            // 1) we need for Promises to be finished as they cannot be serialized into a message
            if (oReturn instanceof Promise) {
                oReturn.then(function (oData) {
                    PageCommunication.getInstance().messageFromPage(sEventType, oData, iMessageID);
                });
            } /* 2) return directly otherwise */
            else {
                PageCommunication.getInstance().messageFromPage(sEventType, oReturn, iMessageID);
            }

        }
    }

    function _startRecording(oInformation) {
        // start recording
        _bActive = true;

        // un-highlight any previously selected DOM nodes
        revealDOMNode(null);

        if (oInformation && oInformation.startImmediate === true) {
            if (!oLastDom && oInformation.domId) {
                oLastDom = _wnd.document.getElementById(oInformation.domId);
            }
            if (!oLastDom) {
                oLastDom = _wnd.document.activeElement;
            }

            //Directly select again (woop)
            setTimeout(function () {
                PageListener.getInstance().handleClickOn(oLastDom);
                oLastDom = null;
                this._bActive = false;
            }.bind(this), 10);
        }
    }

    function _retrieveODataV2Models() {
        return _getAppComponent().then(function (oComponent) {
            var aServices = _getDataServices(oComponent).filter((oService) => oService.version === "2.0");
            var aModels = _getDataModels(oComponent).filter((oModel) => oModel.dataSource && aServices.some((oService) => oService.name === oModel.dataSource));
            return aModels.map((oModel) => {
                oModel.metadata = oComponent.getModel(oModel.name !== "" ? oModel.name : undefined).getServiceMetadata ? oComponent.getModel(oModel.name !== "" ? oModel.name : undefined).getServiceMetadata() : {};
                return oModel;
            });
        });
    }

    function _checkRootComponent() {
        return new Promise(function (resolve) {
            var aElements = _wnd.sap.ui.core.Element.registry.filter((oElement) => oElement.getComponentInstance);

            if (aElements.length > 0) {
                resolve(aElements[0].getComponentInstance());
            } else {
                const iIntervalID = setInterval(function () {
                    aElements = _wnd.sap.ui.core.Element.registry.filter((oElement) => oElement.getComponentInstance);
                    if (aElements.length > 0) {
                        clearInterval(iIntervalID);
                        resolve(aElements[0].getComponentInstance());
                    }
                }, 1000);
            }
        });
    }

    function _stopRecording() {
        _bActive = false;

        // remove all DOM-node highlights
        revealDOMNode(null);
    }

    function _findItemsBySelector(oSelector) {
        // TODO create and use TestItem instance here
        return TestItem.findItemsBySelector(oSelector);
    }

    function _findElementIDsBySelector(oSelector) {
        // TODO create and use TestItem instance here
        return UI5ControlHelper.getMatchingElementIDs(oSelector);
    }

    function _selectItem(oEventData) {
        var oCtrl = _wnd.sap.ui.getCore().byId(oEventData.element);

        if (!oCtrl) {
            return;
        }

        PageListener.getInstance().handleClickOn(oCtrl.getDomRef());
    }

    function _checkAction(oSelector, bReturnSelectedNode = false) {
        var aDOMNodes = UI5ControlHelper.findDOMNodesBySelector(oSelector);
        var oCheckResult = __checkActionPreconditions(aDOMNodes, bReturnSelectedNode);

        return {
            result: oCheckResult.result,
            messages: oCheckResult.message ? [oCheckResult.message] : []
        };
    }

    function __checkActionPreconditions(aDOMNodes, bReturnSelectedNode = false) {

        var oResult;
        var oDOMNode; // pre-set resulting selected DOM node

        // construct result:
        // 1) return an error immediately, if we
        //    (1) found no control for the given element selector,
        //    (2) the given list is empty,
        //    (3) the given parameter is neither an HTMLElement nor a NodeList
        if (!aDOMNodes ||
            (aDOMNodes.length && aDOMNodes.length === 0) ||
            !(aDOMNodes instanceof HTMLElement || aDOMNodes instanceof NodeList || Array.isArray(aDOMNodes))) {
            oResult = {
                result: "error",
                message: {
                    type: "Error",
                    title: "No element found for action",
                    subtitle: "No element found on which the action can be executed!",
                    description: "You have maintained an action to be executed. " +
                        "For the selected attributes/ID, however, no item is found in the current screen. " +
                        "Thus, the action could not be executed."
                }
            }
        } else
            // 2) potentially, there are several DOM nodes found or even none:
            if (Array.isArray(aDOMNodes) || aDOMNodes instanceof NodeList) {
                // 2.1) several DOM nodes are found: issue warning, proceed with first found node and issue a warning
                if (aDOMNodes.length > 1) {
                    // use method 'get' for NodeLists, otherwise access the array
                    oDOMNode = aDOMNodes.item ? aDOMNodes.item(0) : aDOMNodes[0];
                    oResult = {
                        result: "warning",
                        message: {
                            type: "Warning",
                            title: "More than one element found for action",
                            subtitle: "The action will be executed on the first element",
                            description: "Your selector is returning " + aDOMNodes.length + " items, the action will be executed on the first one. " +
                                "Nevertheless, this may yield undesired results."
                        }
                    }
                }
                // 2.2) else only one found: success (see below)
            }

        // if nothing weird happened, indicate success and select the single DOM node
        if (!oResult) {
            oResult = {
                result: "success"
            }
            oDOMNode = aDOMNodes;
        }

        // add DOM node to result if configured
        if (bReturnSelectedNode) {
            oResult.domNode = oDOMNode;
            if (Array.isArray(oResult.domNode) || oResult.domNode instanceof NodeList) {
                oResult.domNode = oResult.domNode.length ? oResult.domNode[0] : null;
            }
        }

        return oResult;
    }

    function _executeAction(oEventData) {
        // get element and DOM node from event data
        var oItem = oEventData.element;
        var iTimeout = oEventData.timeout;
        var oDOMNodeCandidates = UI5ControlHelper.getDomForControl(oItem);

        // check preconditions for action and retrieve DOM node
        var oCheckResult = __checkActionPreconditions(oDOMNodeCandidates, true);

        // prepare temporary variables for processing and returning
        var aEvents = [];
        var aResolutions = [];
        // retrieve DOM node
        var oDOMNode = oCheckResult.domNode;
        delete oCheckResult.domNode;

        // check result of action check
        switch (oCheckResult.result) {
            case "error":
                return oCheckResult;

            case "warning":
                aResolutions.push(oCheckResult);
                break;
        }

        function testEvent(oDOMNode, sListener, oEvent) {

            return new Promise(function (resolve, reject) {

                function handleIssuedEvent(oEventCaught) {
                    if (oEventCaught.ui5tr === "UI5TR" && oEvent === oEventCaught) {
                        resolve({
                            result: "success"
                        });
                    }
                }

                oEvent.ui5tr = "UI5TR";
                oDOMNode.addEventListener(sListener, handleIssuedEvent);
                oDOMNode.dispatchEvent(oEvent);

                if (iTimeout != 0) {
                    // resolve the promise with an error message after 5 seconds
                    setTimeout(function () {
                        resolve({
                            result: "error",
                            message: {
                                type: "Error",
                                title: "Timeout during replay",
                                subtitle: "Your action could not be executed within " + iTimeout + " seconds",
                                description: "The current action could not be executed within " + iTimeout + " seconds. This is done for convenience to avoid potential deadlocks during replay."
                            }
                        });
                    }.bind(this), iTimeout * 1000);
                }
            });
        }

        // identify control for current DOM node so special cases for specific controls can be handled
        var oControl = UI5ControlHelper.getControlFromDom(oDOMNode);

        // reveal DOM node by using CSS classes and add fade-out effect
        revealDOMNode(oDOMNode);
        setTimeout(function () {
            revealDOMNode(null);
        }, 500);

        // for mouse-press events
        if (oItem.property.actKey === "PRS") {

            aEvents.push(new Promise(function (resolve, reject) {
                var Press = null;
                try {
                    Press = _wnd.sap.ui.requireSync("sap/ui/test/actions/Press");
                } catch (err) {

                }
                if (Press) {
                    var oPressAction = new Press();
                    oPressAction.executeOn(oControl);
                    resolve({
                        result: "success"
                    });
                } else {
                    //fallback for old versions..
                    var event = new MouseEvent('mousedown', {
                        view: _wnd.window,
                        bubbles: true,
                        cancelable: true
                    });
                    event.originalEvent = event; //self refer
                    oDOMNode.dispatchEvent(event);

                    var event = new MouseEvent('mouseup', {
                        view: _wnd.window,
                        bubbles: true,
                        cancelable: true
                    });
                    event.originalEvent = event; //self refer
                    oDOMNode.dispatchEvent(event);

                    var event = new MouseEvent('click', {
                        view: _wnd.window,
                        bubbles: true,
                        cancelable: true
                    });
                    event.originalEvent = event; //self refer
                    oDOMNode.dispatchEvent(event);
                    resolve({
                        result: "success"
                    });
                }
            }));

        } else
            // for typing events
            if (oItem.property.actKey === "TYP") {

                var sText = oItem.property.selectActInsert;
                var bClearTextFirst = oItem.property.actionSettings.replaceText;
                var bPressEnterKey = oItem.property.actionSettings.enter;
                var bKeepFocus = !oItem.property.actionSettings.blur;
                var bEnterPressed = false;

                var oEnterTextActionPromise = new Promise(function (resolve, reject) {
                    var EnterText = null;
                    try {
                        EnterText = _wnd.sap.ui.requireSync("sap/ui/test/actions/EnterText");
                    } catch (err) {

                    }
                    if (EnterText) {
                        var oEnterTextAction = new EnterText();

                        oEnterTextAction.setText(sText);
                        oEnterTextAction.setClearTextFirst(bClearTextFirst);
                        oEnterTextAction.setKeepFocus(bKeepFocus);

                        // for UI5 >= 1.76, we can press the Enter key using the action
                        if (oEnterTextAction.setPressEnterKey) {
                            oEnterTextAction.setPressEnterKey(bPressEnterKey);
                            bEnterPressed = true;
                        }

                        oEnterTextAction.executeOn(oControl);

                        resolve({
                            result: "success"
                        });
                    } else {
                        oDOMNode.focus();
                        if (sText.length > 0 && oItem.property.actionSettings.replaceText === false) {
                            oDOMNode.val(oDom.val() + sText);
                        } else {
                            oDOMNode.val(sText);
                        }

                        var event = new KeyboardEvent('input', {
                            view: window,
                            data: '',
                            bubbles: true,
                            cancelable: true
                        });
                        event.originalEvent = event;
                        oDOMNode.dispatchEvent(event);
                        resolve({
                            result: "success"
                        });
                    }
                });

                // chain Promise to execute press on Enter key:
                // we need to ensure that Enter is pressed *after* the text is entered,
                // so we chain the enter after the already existing promise
                var oEnterKeyPressActionPromise = new Promise(function (resolve) {

                    oEnterTextActionPromise.then(function (oResult) {
                        // return that result if...
                        // (1) the typing action above has not worked or
                        // (2) if Enter is *not* to be pressed
                        if (oResult.result !== "success" || !bPressEnterKey) {
                            resolve(oResult);
                            return;
                        }

                        // instead execute the press of the Enter key,
                        // but only if it has not been already pressed
                        if (!bEnterPressed) {
                            // create KeyBoardEvent to simulate Enter
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

                            // dispatch event and resolve appropriately
                            var oEventPromise = testEvent(oDOMNode, "keydown", event);
                            oEventPromise.then(function (oEventPromiseResult) {
                                resolve(oEventPromiseResult);
                            });
                        }
                    });

                });

                // add Promise as an event to be gathered later
                aEvents.push(oEnterKeyPressActionPromise);

            }

        return new Promise(function (resolve) {

            // gather results:
            Promise.all(aEvents).then(function (aPromiseResolutions) {

                // 1) add resolutions to global set of results (e.g., upfront warnings)
                aResolutions = aResolutions.concat(aPromiseResolutions);

                // 2) construct overall result value:
                // 2.1) collect results
                var aResults = aResolutions.map(function (oResult) {
                    return oResult.result;
                });
                // 2.2) check for warnings and errors
                var bWarningIssued = false;
                var bErrorIssued = false;
                aResults.forEach(function (sResult) {
                    if (sResult === "error") {
                        bErrorIssued = true;
                    } else if (sResult === "warning") {
                        bWarningIssued = true;
                    }
                });
                // 2.3) compute result value
                var sResult = bErrorIssued ? "error" : bWarningIssued ? "warning" : "success";

                // 3) gather messages:
                // 3.1) collect messages
                var aMessages = aResolutions.map(function (oResult) {
                    return oResult.message;
                });
                // 3.2) remove duplicate and empty messages
                aMessages = aMessages.filter(function (sMessage, pos) {
                    return !!sMessage && aMessages.indexOf(sMessage) === pos;
                });

                resolve({
                    result: sResult,
                    messages: aMessages,
                    type: "ACT"
                });
            }.bind(this));

        }.bind(this));
    }

    function _executeAssert(oEventData) {

        // unpack event data
        var oElementSelector = oEventData.element;
        var oAssertionData = oEventData.assert;

        // find elements to assert on
        var aFoundElements = TestItem.findItemsBySelector(oElementSelector);

        // define return value to be filled later
        var oResult;

        // execute assertion based on its type
        var sAssType = oAssertionData.assertType; // ATTR | EXS | MTC
        switch (sAssType) {
            case "ATTR":

                // get the asserts to ensure
                var aAsserts = oAssertionData.asserts;

                // if there are no asserts given, this happens likely due to an old test record for which this information is not stored.
                // the user needs to be informed that their test is somehow "broken" and, likely, the test need to be re-recorded
                if (!aAsserts) {
                    oResult = {
                        result: "error",
                        messages: [{
                            type: "Error",
                            title: "Attribute-based assert is not complete",
                            subtitle: "Assert details cannot be found",
                            description: "The configuration details for the list of attribute-based asserts cannot be found. Therefore, no assert can be carried out. Please contact the developer or re-record the test."
                        }]
                    };

                    break;
                }

                // check asserts for all found elements
                aFoundElements.forEach(function (oFoundElement) {

                    // temporary variables for current element
                    var aAllErrors = []; // storage for all error messages
                    var bAssertFailed = false; //

                    // check all asserts for the current element
                    aAsserts.forEach(function (oAssert) {

                        var bAttributeCheckFailed = false;
                        var sCurrentError = "";

                        var sAssertLocalScope = oAssert.localScope;
                        var oAssertSpec = oAssert.spec;

                        // check for invalid line
                        if (!oAssertSpec) {
                            return;
                        }

                        var sAssert = sAssertLocalScope + oAssertSpec;

                        var oCurItem = oFoundElement;
                        var aSplit = sAssert.split(".");
                        for (var x = 0; x < aSplit.length; x++) {
                            if (typeof oCurItem[aSplit[x]] === "undefined") {
                                bAttributeCheckFailed = true;
                                break;
                            }
                            oCurItem = oCurItem[aSplit[x]];
                        }

                        if (bAttributeCheckFailed === false) {
                            // depending on the operator, everything okay or nothing okay:
                            // 1) "equals"
                            if (oAssert.operatorType === "EQ" && oAssert.criteriaValue !== oCurItem) {
                                bAttributeCheckFailed = true;
                                sCurrentError = "Value '" + oAssert.criteriaValue + "' of '" + sAssert + "' does not match '" + oCurItem + "'.";
                            } else
                                // 2) "does not equal"
                                if (oAssert.operatorType === "NE" && oAssert.criteriaValue === oCurItem) {
                                    bAttributeCheckFailed = true;
                                    sCurrentError = "Value '" + oAssert.criteriaValue + "' of '" + sAssert + "' does match '" + oCurItem + "'.";
                                } else
                                    // 3) "contains" and "does not contain":
                                    if (oAssert.operatorType === "CP" || oAssert.operatorType === "NP") {
                                        // convert both to string if required
                                        var sStringContains = oAssert.criteriaValue;
                                        var sStringCheck = oCurItem;
                                        if (typeof sStringCheck !== "string") {
                                            sStringCheck = sStringCheck.toString();
                                        }
                                        if (typeof sStringContains !== "string") {
                                            sStringContains = sStringContains.toString();
                                        }
                                        // 3.1) "contains"
                                        if (oAssert.operatorType === "CP" && sStringCheck.indexOf(sStringContains) === -1) {
                                            bAttributeCheckFailed = true;
                                            sCurrentError = "Value '" + oCurItem + "' of '" + sAssert + "' does not contain '" + oAssert.criteriaValue + "'.";
                                        } else
                                            // 3.2) "does not contain"
                                            if (oAssert.operatorType === "NP" && sStringCheck.indexOf(sStringContains) !== -1) {
                                                bAttributeCheckFailed = true;
                                                sCurrentError = "Value '" + oCurItem + "' of '" + sAssert + "' does contain '" + oAssert.criteriaValue + "'.";
                                            }
                                    }
                        }

                        if (bAttributeCheckFailed === true) {
                            oAssert.assertionOK = false;
                            bAssertFailed = true;
                            aAllErrors.push({
                                type: "Error",
                                title: "Assertion error",
                                subtitle: sCurrentError,
                                description: sCurrentError
                            });
                        }

                    });

                    oFoundElement.assertMessages = aAllErrors;
                    oFoundElement.assertionOK = !bAssertFailed;
                });

                // check if any assertion has assertionOK === false
                var bFound = aAsserts.some(function (oAssert) {
                    return oAssert.assertionOK === false;
                });

                // indicate overall error
                if (bFound === true) {
                    oResult = {
                        result: "error",
                        messages: [{
                            type: "Error",
                            title: "Attribute-based assert is failing",
                            subtitle: "At least, one attribute-based assert is failing",
                            description: "At least, one of the configured attribute-based assertions is failing. Please see the details on the found items within the test step."
                        }]
                    };
                }

                break;

            case "EXS":
            case "VIS":

                // check whether there is no found element
                if (aFoundElements.length === 0) {

                    oResult = {
                        result: "error",
                        messages: [{
                            type: "Error",
                            title: "Assert is failing",
                            subtitle: "No item found",
                            description: "For the selected attributes/ID, no item is found. Thus, assertions cannot be performed."
                        }]
                    };

                }

                break;

            case "MTC":

                // match number of found elements against expected number
                var iExpectedCount = oAssertionData.assertMatchingCount;
                if (aFoundElements.length !== iExpectedCount) {

                    // create single error message for proper re-use
                    var oErrorMessage = {
                        type: "Error",
                        title: "Assert is failing",
                        subtitle: aFoundElements.length + " items found but " + iExpectedCount + " expected",
                        description: "Your selector is returning " + aFoundElements.length + " items but " + iExpectedCount + " are expected. The configured assertion fails as the expected value is different."
                    };

                    // indicate failed assertion for all identified elements
                    aFoundElements.forEach(function (oItem) {
                        oItem.assertMessages = [oErrorMessage];
                        oItem.assertionOK = false;
                    });

                    oResult = {
                        result: "error",
                        messages: [oErrorMessage]
                    };

                } else {

                    // indicate successful assertion for all identified elements
                    aFoundElements.forEach(function (oItem) {
                        oItem.assertMessages = [];
                        oItem.assertionOK = true;
                    });

                }

                break;

            default:
                break;
        }

        // if nothing weird happened, indicate success and select the single DOM node
        if (!oResult) {
            oResult = {
                result: "success",
                messages: []
            }
        }

        return oResult;
    }

    function _getWindowInfo() {
        return {
            title: _wnd.document.title,
            url: _wnd.window.location.href,
            hash: _wnd.window.location.hash,
            ui5Version: _wnd.sap.ui.version
        };
    }

    var _cachedSupportAssistantRules = []; // list of support-assistant rules being cached
    function _runSupportAssistant(oComponent) {

        return new Promise(function (resolve, reject) {

            var oSupSettings = oComponent.rules;
            var sComponent = oComponent.component;

            _wnd.sap.ui.require(["sap/ui/support/Bootstrap"], function (Bootstrap) {
                Bootstrap.initSupportRules(["silent"]);

                // exclude rules that are selected in UI from being run:
                // as the set of cached rules is empty on the first run, all rules will be applied.
                // an exclusion of rules can only be applied on consecutive runs
                var aExclude = oSupSettings.supportRules; // excluded rules
                var appliedSupportAssistantRules = _cachedSupportAssistantRules.filter(function (oRule) {
                    return !aExclude.includes(oRule.libName + "/" + oRule.ruleId)
                });

                // call the support-assistant analysis asynchronously, so we ensure that the results can actually be retrieved
                setTimeout(function () {

                    // run support assistant with the given set of rules (or no rules at all if none have been cached yet)
                    // TODO this function is deprecated for UI5 >= 1.60. "Please use sap/ui/support/RuleAnalyzer instead."
                    _wnd.jQuery.sap.support.analyze({
                        type: "components",
                        components: [sComponent]
                    }, appliedSupportAssistantRules.length > 0 ? appliedSupportAssistantRules : undefined)
                        // post-process results
                        .then(function () {
                            var aIssues = _wnd.jQuery.sap.support.getLastAnalysisHistory();

                            var aStoreIssue = [];
                            for (var i = 0; i < aIssues.issues.length; i++) {
                                var oIssue = aIssues.issues[i];

                                // remove issues of global context if filtered out
                                if (oSupSettings.ignoreGlobal === true && oIssue.context.id === "WEBPAGE") {
                                    continue;
                                }

                                // properly set states and importance
                                var sState = "Error";
                                var iImportance = 3;
                                if (oIssue.severity === "Medium") {
                                    sState = "Warning";
                                    iImportance = 2;
                                } else if (oIssue.severity === "Low") {
                                    sState = "None";
                                    iImportance = 1;
                                }

                                // add issue to list that is sent to extension
                                aStoreIssue.push({
                                    severity: oIssue.severity,
                                    details: oIssue.details,
                                    context: oIssue.context.id,
                                    rule: oIssue.rule.id,
                                    ruleText: oIssue.rule.description,
                                    state: sState,
                                    importance: iImportance
                                });
                            }

                            // sort issues by importance, ascending
                            aStoreIssue = aStoreIssue.sort(function (aObj, bObj) {
                                if (aObj.importance <= bObj.importance) {
                                    return 1;
                                }

                                return -1;
                            });

                            // retrieve available rules and update cache (this cannot be done earlier, as the analysis triggers the
                            // loading of the rules itself; see excluded rules above)
                            var oLoader = _wnd.sap.ui.require("sap/ui/support/supportRules/RuleSetLoader");
                            if (oLoader) { //only as of 1.52.. so ignore that for the moment
                                _cachedSupportAssistantRules = oLoader.getAllRuleDescriptors();
                            }

                            // construct and compute result:
                            // 0) construct intermediate return value
                            var oReturn = {
                                result: "success",
                                messages: [],
                                issues: aStoreIssue,
                                rules: _cachedSupportAssistantRules
                            };
                            // 1) check if there are any critical issues (in the future, maybe also for certain issues or contexts... let's see)
                            var iIdxError = aStoreIssue.findIndex(function (oIssue) {
                                return oIssue.severity === "High";
                            })
                            // 2) there was a high-severity issue: error
                            if (iIdxError !== -1) {
                                oReturn.result = "error";
                                oReturn.messages = [{
                                    type: "Error",
                                    title: "Support Assistant is failing",
                                    subtitle: "At least, one support-assistant rule is failing",
                                    description: "At least, one of the maintained support-assistant rules is failing. See the support-assistant results within the test step for details."
                                }];
                            }

                            // return the analysis results to the extension
                            resolve(oReturn);

                        }.bind(this));
                }.bind(this), 0);


            }.bind(this));
        }.bind(this));

    }

    function _disconnect() {
        // unlock page, stop recording, and reset all controls and listeners
        _bActive = false;
        _bPageLocked = false;
        _oPageLockBusyDialog.destroy();
        PageListener.getInstance().reset();
        PageCommunication.getInstance().reset();

        // ask user whether to reload page to remove any injections
        _wnd.sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
            MessageBox.error(
                "The connection to the UI5 test recorder has been lost. Do you want to reload this page to reset it?", {
                icon: MessageBox.Icon.QUESTION,
                title: "Reload page?",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        location.reload();
                    }
                }
            }
            );
        });
    }

    // #endregion

    // #region Data Model handling

    function _getAppComponent() {
        return new Promise(function (resolve, reject) {
            var aElements = _wnd.sap.ui.core.Element.registry.filter((oElement) => oElement.getComponentInstance);
            if (aElements.length > 0) {
                resolve(aElements[0].getComponentInstance());
            } else {
                reject([]);
            }
        });
    }

    function _getDataServices(oComponent) {
        var oManifest = oComponent.getManifest();
        var oSapAppSection = oManifest["sap.app"];
        var oDataSources = oSapAppSection.dataSources;
        if (oDataSources) {
            var aServices = Object.keys(oDataSources).map((sService) => {
                var oService = {
                    name: sService
                };
                oService.uri = oDataSources[sService].uri;
                oService.type = oDataSources[sService].type;
                if (oService.type === "OData" && oDataSources[sService].settings) {
                    oService.version = oDataSources[sService].settings.odataVersion;
                }
                return oService;
            });
            return aServices;
        } else {
            return [];
        }
    }

    function _getDataModels(oComponent) {

        var oManifest = oComponent.getManifest();
        var oUI5 = oManifest["sap.ui5"];
        if (!oUI5) {
            return [];
        }

        var oModels = oUI5.models;
        if (!oModels) {
            return [];
        }

        return Object.keys(oModels).map((sModelName) => {
            var oModelObject = oModels[sModelName];
            oModelObject.name = sModelName;
            return oModelObject;
        });
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

        _fnMouseDownListener(event) {
            if (event.button == 2) {
                oLastDom = event.target;
            }
        }

        _fnClickListener(event) {
            var event = event || _wnd.window.event,
                el = event.target || event.srcElement;

            if (_bActive === false) {

                // no active recording, but still recording ongoing (e.g., in the other extension part)
                if (_bPageLocked === true) {
                    // sap.m.MessageToast.show("Please finalize the test step in the test-recorder popup first.");
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }

                return;
            }

            _bActive = false;
            this.handleClickOn(el);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }

        setupPageListener() {
            /** use the css hovering class */
            _wnd.document.onmouseover = function (e) {
                if (_bActive === false) {
                    return;
                }
                var e = e || _wnd.window.event,
                    el = e.target || e.srcElement;
                el.classList.add("UI5TR_ElementHover");
            };

            _wnd.document.onmouseout = function (e) {
                if (!_oDialog || !_oDialog.isOpen()) {
                    var e = e || _wnd.window.event,
                        el = e.target || e.srcElement;
                    el.classList.remove("UI5TR_ElementHover");
                }
            };

            _wnd.document.addEventListener("mousedown", this._fnMouseDownListener, true);

            _wnd.document.addEventListener('click', this._fnClickListener.bind(this), true);

            _wnd.sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
                MessageToast.show("UI5 test recorder fully injected!");
            });
        }

        /**
         * Resets the page listener by removing all page listeners and destroying the instance.
         */
        reset() {
            _wnd.document.onmouseover = null;
            _wnd.document.mousedown = null;
            _wnd.document.removeEventListener('mousedown', this._fnMouseDownListener, true);
            _wnd.document.removeEventListener('click', this._fnClickListener.bind(this), true);
            _wnd.document.onclick = null;

            PageListener._oInstance = null;
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
                var oCtrlTest = _wnd.sap.ui.getCore().byId(sItem);

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
     * @param {_wnd.sap.ui.core.Element} oControl the UI5 control to handle
     * @param {HTMLElement} oDOMNode the corresponding selected DOM node
     * @param {HTMLElement} oOriginalDOMNode the DOM node that has been initially selected on the site
     */
    class TestItem {

        /**
         * Resets the static variable {@link _oTestGlobalCache}.
         */
        static resetCache() {
            TestItem._oTestGlobalCache = {
                fnGetElement: {
                    true: {},
                    false: {}
                },
                fnGetElementInfo: {
                    true: {},
                    false: {}
                },
                label: null
            };
        }

        constructor(oControl, oDOMNode, oOriginalDOMNode) {
            this._oControl = oControl;
            this._oDOMNode = oDOMNode;
            this._oOriginalDOMNode = oOriginalDOMNode;
            this._testItem = null;

            // correct original DOM not if not existing
            this._oOriginalDOMNode = this._oOriginalDOMNode ? this._oOriginalDOMNode : this._oDOMNode;

            TestItem.resetCache();
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
                    isInput: ["input", "textarea"].includes(oChild.tagName.toLowerCase()),
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

            var aInformation = UI5ControlHelper.findControlsBySelector(oSelector);

            //remove all items, which are starting with "testDialog"..
            var aItems = aInformation.filter(function (oItem) {
                return !oItem.getId().includes("testDialog");
            })

            var aItemsEnhanced = aItems.map(function (oItem) {
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
                    bindingContext: {},
                    lumiraProperty: {},
                    context: {},
                    model: {},
                    metadata: {},
                    tableInfo: {},
                    viewProperty: {},
                    classArray: [],
                    identifier: {
                        domId: "",
                        ui5Id: "",
                        idCloned: false,
                        idGenerated: false,
                        idInternal: false,
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

                if (!oReturn.identifier) {
                    oReturn.identifier = {};
                }
                oReturn.identifier.domId = oDomNode.id;
                oReturn.identifier.ui5Id = UI5ControlHelper.getUi5Id(oItem);
                oReturn.identifier.ui5LocalId = UI5ControlHelper.getUi5LocalId(oItem);
                oReturn.identifier.ui5AbsoluteId = oItem.getId();

                if (oItem.zenPureId) {
                    oReturn.identifier.lumiraId = oItem.zenPureId;
                }

                // get class names from metadata
                oReturn.classArray = [];
                var oMeta = oItem.getMetadata();
                while (oMeta) {
                    oReturn.classArray.push({
                        elementName: oMeta._sClassName
                    });
                    oMeta = oMeta.getParent();
                }

                // identify whether the element has been cloned:
                // 1) if the UI5 ID contains a "-" with a following number, it is most likely a dependent control (e.g., based on aggregation or similar) and, thus, cloned
                if (RegExp("([A-Z,a-z,0-9])-([0-9])").test(oReturn.identifier.ui5Id)) {
                    oReturn.identifier.idCloned = true;
                } /* 2) check via metadata */
                else {
                    var oMetadata = oItem.getMetadata();
                    while (oMetadata) {
                        // if there is no class name available, we can stop searching
                        if (!oMetadata._sClassName) {
                            break;
                        }

                        // item is cloned if it is an Item, a Row, or an ObjectListItem
                        if (["_wnd.sap.ui.core.Item", "_wnd.sap.ui.table.Row", "sap.m.ObjectListItem"].includes(oMetadata._sClassName)) {
                            oReturn.identifier.idCloned = true;
                        }

                        oMetadata = oMetadata.getParent();
                    }
                }

                if (!oReturn.identifier.idCloned) {
                    oReturn.identifier.idCloned = false;
                }

                // identify whether the element ID has been generated:
                // if the ui5id contains a "__", it is most likely a generated ID which should NOT BE USESD LATER!
                if (oReturn.identifier.ui5Id.includes("__")) {
                    oReturn.identifier.idGenerated = true;
                } else {
                    oReturn.identifier.idGenerated = false;
                }
                if (oReturn.identifier.ui5Id.includes("-")) {
                    oReturn.identifier.idInternal = true;
                } else {
                    oReturn.identifier.idInternal = false;
                }

                // identify whether the local element ID is cloned or generated
                if (oReturn.identifier.idCloned || oReturn.identifier.ui5LocalId.includes("__")) {
                    oReturn.identifier.localIdClonedOrGenerated = true;
                } else {
                    oReturn.identifier.localIdClonedOrGenerated = false;
                }



                // get class names from metadata
                oReturn.classArray = [];
                var oMeta = oItem.getMetadata();
                while (oMeta) {
                    oReturn.classArray.push({
                        elementName: oMeta._sClassName
                    });
                    oMeta = oMeta.getParent();
                }

                // get metadata:
                // 1) basic information and structure
                oReturn.metadata = {
                    elementName: oItem.getMetadata().getElementName(),
                    componentName: UI5ControlHelper.getOwnerComponent(oItem),
                    componentId: "",
                    componentTitle: "",
                    componentDescription: "",
                    componentDataSource: {},
                    lumiraType: oItem.zenType ? oItem.zenType : ""
                };

                // 2) enhance component information
                var oComponent = _wnd.sap.ui.getCore().getComponent(oReturn.metadata.componentName);
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


                var oContextsAll = UI5ControlHelper.getContexts(oItem);
                //contexts are always relevant if we are inside a table - in such a scenario we normally want to know the items/rows context model of our table
                //as with this context, we can actually go foreward and select by this item
                var oCur = oItem;
                var sModelName = "";
                while (oCur) {
                    var sControl = oCur.getMetadata()._sClassName;
                    if (sControl === "sap.m.Table" || sControl === "sap.m.PlanningCalendar" || sControl === "sap.m.Tree" || sControl === "sap.m.List" || sControl === "sap.ui.table.Table" || sControl === "sap.ui.table.TreeTable" || sControl === "sap.zen.crosstab.Crosstab") {
                        //get the binding info-model..
                        if (oCur.mBindingInfos["items"] || oCur.mBindingInfos["rows"]) {
                            var sBinding = oCur.mBindingInfos["items"] ? "items" : "rows";
                            var oBndg = oCur.mBindingInfos[sBinding];
                            if (oBndg.parts) {
                                for (let i = 0; i < oBndg.parts.length; i++) {
                                    sModelName = oItem.mBindingInfos[sBinding].parts[i].model;
                                    break;
                                }
                            } else {
                                sModelName = oBndg.model;
                            }
                        }
                        break;
                    }
                    oCur = oCur.getParent();
                }
                var bAnyBinding = false;
                if (sModelName.length === 0) {
                    for (let sBinding in oItem.mBindingInfos) {
                        if (!oItem.mBindingInfos[sBinding].parts) {
                            if (oItem.mBindingInfos[sBinding].model) {
                                bAnyBinding = true;
                                sModelName = oItem.mBindingInfos[sBinding].model;
                                break;
                            }
                            continue;
                        }
                        for (let i = 0; i < oItem.mBindingInfos[sBinding].parts.length; i++) {
                            sModelName = oItem.mBindingInfos[sBinding].parts[i].model;
                        }
                        bAnyBinding = true;
                    }
                    if (!bAnyBinding) {
                        //search up the binding context hierarchy (first=direct element bindings, than bindings coming directly from parent, than via propagated views/elements)
                        let bndgCtx = {};
                        if (!$.isEmptyObject(oItem.mElementBindingContexts)) {
                            bndgCtx = oItem.mElementBindingContexts;
                        } else if (!$.isEmptyObject(oItem.oBindingContexts)) {
                            bndgCtx = oItem.oBindingContexts;
                        } else if (!$.isEmptyObject(oItem.oPropagatedProperties.oBindingContexts)) {
                            bndgCtx = oItem.oPropagatedProperties.oBindingContexts;
                        }
                        if (bndgCtx) {
                            for (let sModelNameLoc in bndgCtx) {
                                sModelName = sModelNameLoc;
                                break;
                            }
                        }
                    }
                }
                if (sModelName && oContextsAll && oContextsAll[sModelName]) {
                    oReturn.context = oContextsAll[sModelName];
                }

                //get table information..
                oReturn.tableInfo = UI5ControlHelper.getTableInformation(oItem); // get the table-information!

                // get view information
                var oView = UI5ControlHelper.getParentControlAtLevel(oItem, 1, true); // get the view!
                if (oView && oView.getProperty("viewName")) {
                    oReturn.viewProperty = {};
                    oReturn.viewProperty.viewName = oView.getProperty("viewName");
                    oReturn.viewProperty.localViewName = oReturn.viewProperty.viewName.split(".").pop();
                    if (oReturn.viewProperty.localViewName.length) {
                        oReturn.viewProperty.localViewName = oReturn.viewProperty.localViewName.charAt(0).toUpperCase() + oReturn.viewProperty.localViewName.substring(1);
                    }
                }

                // get binding information:
                if (oItem.mBindingInfos) {
                    oReturn.binding = {};
                }
                // 1) all bindings
                for (var sBinding in oItem.mBindingInfos) {
                    oReturn.binding[sBinding] = UI5ControlHelper.getBindingInformation(oItem, sBinding);
                }
                // 2) special binding information for "sap.m.Label"
                if (oReturn.metadata.elementName === "sap.m.Label" && !oReturn.binding.text) {
                    // TODO binding from parent: this needs testing!
                    // if the label is part of a FormElement, we may obtain further binding information based on the parent
                    if (oItem.getParent() && oItem.getParent().getMetadata()._sClassName === "_wnd.sap.ui.layout.form.FormElement") {
                        var oParentBndg = oItem.getParent().getBinding("label");
                        if (oParentBndg) {
                            oReturn.binding["text"] = [{
                                path: oParentBndg.sPath && oParentBndg.getPath(),
                                prefixedFullPath: oParentBndg.sPath && oParentBndg.getPath(), // TODO prefixedFullPath needs adjustments
                                "static": oParentBndg.oModel && oParentBndg.getModel() instanceof _wnd.sap.ui.model.resource.ResourceModel // TODO change in accordance with UI5ControlHelper.getBindingInformation
                            }];
                        }
                    }
                }

                //return specific properties for element (especially reporting..)
                if (oItem.getMetadata()._sClassName === "sap.zen.crosstab.Crosstab") {
                    oReturn.lumiraProperty["numberOfDimensionsOnRow"] = oItem.oHeaderInfo.getNumberOfDimensionsOnRowsAxis();
                    oReturn.lumiraProperty["numberOfDimensionsOnCol"] = oItem.oHeaderInfo.getNumberOfDimensionsOnColsAxis();
                    oReturn.lumiraProperty["numberOfRows"] = oItem.rowHeaderArea.oDataModel.getRowCnt();
                    oReturn.lumiraProperty["numberOfCols"] = oItem.columnHeaderArea.oDataModel.getColCnt();
                    oReturn.lumiraProperty["numberOfDataCells"] = oItem.getAggregation("dataCells").length;
                }
                if (oItem.getMetadata()._sClassName === "sap.designstudio.sdk.AdapterControl" &&
                    oItem.zenType === "com_sap_ip_bi_VizFrame" && oItem.widget) {
                    oReturn.lumiraProperty["chartTitle"] = oItem.widget.getTitleTextInternal();
                    oReturn.lumiraProperty["chartType"] = oItem.widget.vizType();
                    var aFeedItems = JSON.parse(oItem.widget.feedItems());
                    oReturn.lumiraProperty["dimensionCount"] = 0;
                    oReturn.lumiraProperty["measuresCount"] = 0;
                    aFeedItems.filter(function (e) {
                        return e.type == "Dimension";
                    }).forEach(function (e) {
                        oReturn.lumiraProperty["dimensionCount"] += e.values.length;
                    });
                    aFeedItems.filter(function (e) {
                        return e.type == "Measure";
                    }).forEach(function (e) {
                        oReturn.lumiraProperty["measuresCount"] += e.values.length;
                    });

                    oReturn.lumiraProperty["dataCellCount"] = 0;
                    oItem.widget._uvbVizFrame.vizData().data().data.forEach(function (e) {
                        oReturn.lumiraProperty["numberOfDataCells"] += e.length;
                    });
                }

                // get all simple properties
                if (oItem.mProperties) {
                    oReturn.property = {};
                }
                for (var sProperty in oItem.mProperties) {
                    var fnGetter = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)];
                    if (fnGetter) {
                        oReturn.property[sProperty] = fnGetter.call(oItem);
                    } else {
                        oReturn.property[sProperty] = oItem.mProperties[sProperty];
                    }
                }

                // get lengths of aggregation
                var aAggregations = oItem.getMetadata().getAllAggregations();
                if (aAggregations) {
                    oReturn.aggregation = {};
                }
                oReturn.aggregationNames = [];
                for (var sAggregation in aAggregations) {
                    oReturn.aggregationNames.push({ name: sAggregation });
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
                    oAggregationInfo.rows = aAggregationData.map(function (oAggregationRow) {
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
            //currently we don't want to adapt the functions, therefore we remove empty objects
            if (Object.keys(oReturn.label).length === 0) {
                delete oReturn.label;
            }
            oReturn.itemdata = getElementInformationDetails(UI5ControlHelper.getItemDataForItem(oControl), bFull);
            //currently we don't want to adapt the functions, therefore we remove empty objects
            if (Object.keys(oReturn.itemdata).length === 0) {
                delete oReturn.itemdata;
            }

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

                    for (var sProperty in oItem.property) {
                        var sGetter = "get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1);
                        if (!oObjectProps[sProperty]) {
                            oObjectProps[sProperty] = {
                                _totalAmount: 0
                            };
                        }
                        var sValue = undefined;

                        if (typeof aItems[i][sGetter] === "function") {
                            sValue = aItems[i][sGetter]();
                        }
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
            if (oItem.parents) {
                oItem.parents.forEach(function (oParent) {
                    _removeNonSerializableData(oParent);
                });
            }

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

    TestItem.resetCache();

    // #endregion

    // #region UI5ControlHelper

    class UI5ControlHelper {

        // #region Control identification (i.e., from DOM, parents, children)

        /**
         * Retrieves the fully initialized instance of the current SAPUI5 Core (and not only its interface).
         *
         * Using the returned element, it is possible to retrieve all registered UI5 elements (see {UI5ControlHelper.getRegisteredElements}) before UI5 v1.67.
         *
         * @returns {_wnd.sap.ui.core.Core} the fully initialized Core instance
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
            _wnd.sap.ui.getCore().registerPlugin(fakePlugin);
            _wnd.sap.ui.getCore().unregisterPlugin(fakePlugin);

            return oCoreObject;
        }

        /**
         * Retrieves all registered UI5 elements from the Core object.
         *
         * @returns {Object.<_wnd.sap.ui.core.ID, _wnd.sap.ui.core.Element>} object with all registered elements, keyed by their ID
         */
        static getRegisteredElements() {
            var oElements = {};

            // try to use registry (UI5 >= v1.67)
            if (_wnd.sap.ui.core.Element && _wnd.sap.ui.core.Element.registry) {
                oElements = _wnd.sap.ui.core.Element.registry.all();
            }
            // use workaround with fully initialized core otherwise
            else {
                oElements = UI5ControlHelper.getInitializedCore().mElements;
            }

            return oElements;
        }

        /**
         *
         * @param {object} oSelector
         */
        static getMatchingElementIDs(oSelector) {
            var aInformation = UI5ControlHelper.findControlsBySelector(oSelector);

            //remove all items, which are starting with "testDialog"..
            var aItems = aInformation.filter(function (oItem) {
                return !oItem.getId().includes("testDialog");
            })

            return aItems.map((oItem) => {
                return {
                    id: oItem.sId,
                    className: oItem.getMetadata()._sClassName
                };
            });
        }

        /**
         * Retrieves the UI5 control for the given DOM node (i.e., HTML element).
         *
         * @param {HTMLElement} oDOMNode a DOM node (e.g., selected in UI)
         *
         * @returns {_wnd.sap.ui.core.Element} the UI5 controls associated with the given DOM node
         *
         * @see sap/ui/dom/jquery/control-dbg.js
         */
        static getControlFromDom(oDOMNode) {
            // predefine resulting element ID
            var sResultID;

            // if we do not have DOM node to work with
            if (!oDOMNode) {
                return null;
            }

            if (Array.isArray(oDOMNode)) {
                oDOMNode = oDOMNode[0];
            }
            if (oDOMNode instanceof NodeList) {
                oDOMNode = oDOMNode[0];
            }


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
            return _wnd.sap.ui.getCore().byId(sResultID);
        }

        /**
         * Retrieves the UI5 controls for the given DOM nodes (i.e., HTML elements).
         *
         * @param {Array} oDOMNodes an Array of DOM nodes
         *
         * @returns {Array(_wnd.sap.ui.core.Element)} the UI5 controls associated with the given DOM nodes
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
         * @returns {HTMLElement|NodeList} if only one element is found, the DOM node associated with the given UI5 control; a NodeList instance otherwise
         */
        static getDomForControl(oControlData) {
            // check whether the given control is not embedded into another one
            var sExtension = oControlData.property.domChildWith;
            if (!sExtension.length) {
                return [_wnd.sap.ui.getCore().byId(oControlData.item.identifier.ui5AbsoluteId).getDomRef()];
            }

            // construct a default query for the combined ID
            var sIdSelector = "*[id$='" + (oControlData.item.identifier.ui5AbsoluteId + sExtension) + "']";
            var aDomNodes = _wnd.document.querySelectorAll(sIdSelector);

            // unwrap single item to establish compatibility with '_wnd.sap.ui.getCore().byId' as used above
            if (aDomNodes.length >= 1) {
                return aDomNodes;
            } else {
                return [];
            }
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
                if (oChildControl && (oChildControl.getId() === oControl.getId() || oChildControl.getId().startsWith(oControl.getId() + "-"))) {
                    aReturn.push(oChild);
                    aReturn = aReturn.concat(UI5ControlHelper.getAllChildrenOfDom(oChild, oControl));
                }
            }

            return aReturn;
        }

        static findDOMNodesBySelector(oSelector) {

            // collect all string selectors
            var aSelectorStrings = [];

            if (typeof oSelector !== "string") {
                if (JSON.stringify(oSelector) == JSON.stringify({})) {
                    return [];
                }

                var aElements = UI5ControlHelper.getRegisteredElements(oSelector);

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
            var aDOMNodes = aSelectorStrings.map(function (sIdSelector) {
                return _wnd.document.querySelector(sIdSelector);
            });

            // if the result does not make sense or is no UI5 control, return empty
            if (!aDOMNodes || !aDOMNodes.length) {
                aDOMNodes = [];
            }

            return aDOMNodes;
        }

        static findControlsBySelector(oSelector) {

            // select DOM nodes based on selector strings
            var aDOMNodes = UI5ControlHelper.findDOMNodesBySelector(oSelector);

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

        static getTableInformation(oItem) {
            let aParentIds = [];
            var oReturn = {
                insideATable: false,
                tableRow: 0,
                tableCol: 0
            };

            aParentIds.push(oItem.getId());
            let oParent = oItem.getParent();
            while (oParent) {
                aParentIds.push(oParent.getId());
                var sControl = oParent.getMetadata()._sClassName;
                if (sControl === "sap.m.Table" || sControl === "sap.m.PlanningCalendar" || sControl === "sap.m.List" || sControl === "sap.ui.table.Table" ||
                    sControl === "sap.ui.table.TreeTable" || sControl === "sap.zen.crosstab.Crosstab") {
                    oReturn.insideATable = true;

                    let aRows = oParent.getAggregation("rows") ? oParent.getAggregation("rows") : oParent.getAggregation("items");
                    let aCol = oParent.getColumns ? oParent.getColumns().filter(e => e.getVisible()) : [];
                    if (aRows) {
                        for (let j = 0; j < aRows.length; j++) {
                            if (aParentIds.indexOf(aRows[j].getId()) !== -1) {
                                oReturn.tableRow = j;
                                oReturn.tableCol = 0;
                                let iVisibleColCounter = 0;
                                let aCells = aRows[j].getCells() ? aRows[j].getCells() : [];
                                for (let x = 0; x < aCells.length; x++) {
                                    if (aCol && aCol.length && aCol.length > x) {
                                        if (aCol[x].getVisible() === false) {
                                            continue;
                                        }
                                    }
                                    iVisibleColCounter = iVisibleColCounter + 1;
                                    if (aParentIds.indexOf(aCells[x].getId()) !== -1) {
                                        oReturn.tableCol = iVisibleColCounter;
                                        if (aCol && aCol.length && aCol.length > x) {
                                            oReturn.tableColId = this.getUi5Id(aCol[x]);
                                            oReturn.tableColDescr = aCol[x].getLabel ? aCol[x].getLabel().getText() : "";
                                        }
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                    break;
                }
                oParent = oParent.getParent();
            }
            return oReturn;
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
            var mBindingInfos = oItem.getBindingInfo(sBinding);

            var oReturn = {};

            if (!mBindingInfos) {
                return oReturn;
            }

            // identify binding parts if existing, use binding infos instead otherwise
            var aBindingParts = (mBindingInfos.parts) ? mBindingInfos.parts : [mBindingInfos];

            // compute binding data for each part
            aBindingParts.forEach(function (mPartBindingInfo, iIndex) {

                // obtain path
                var sPath = mPartBindingInfo.path;

                // construct a model prefix
                var sModel = mPartBindingInfo.model;
                var sModelStringified = sModel === "undefined" || sModel === undefined ? "" : sModel;
                var sModelStringifiedPrefixed = (sModelStringified ? sModelStringified + ">" : "");

                // obtain binding context
                var oBndgContext = oItem.getBindingContext(sModel);
                var sBndgContextPrefix = oBndgContext ? oBndgContext.getPath() + "/" : "";
                var bNeedsContextPrefix = !!sBndgContextPrefix && sPath.charAt(0) !== "/";

                // obtain model information *for the current binding part*
                var mBindings = oItem.getBinding(sBinding);
                var oModel = undefined;
                if (mBindings) {
                    oModel = (mBindings.oModel) ? mBindings.oModel : mBindings.getBindings()[iIndex].getModel();
                }

                // construct fully-qualified path
                var sPrefixedFullPath = sModelStringifiedPrefixed +
                    (bNeedsContextPrefix ? sBndgContextPrefix : "") +
                    sPath;

                // combine everything into a returned object
                oReturn[sBinding + "#" + iIndex] = {
                    property: sBinding,
                    model: sModel,
                    path: sPath,
                    contextPath: bNeedsContextPrefix ? sBndgContextPrefix : "",
                    relativePath: sPath,
                    prefixedFullPath: sPrefixedFullPath,
                    static: mPartBindingInfo.mode !== _wnd.sap.ui.model.BindingMode.TwoWay,
                    jsonBinding: oModel && oModel instanceof _wnd.sap.ui.model.json.JSONModel
                };
            });

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
            if (oItem instanceof _wnd.sap.ui.core.Item) {
                return oItem;
            }
            if (!oItem instanceof _wnd.sap.m.ListItemBase) {
                return null;
            }

            //(1) check by custom data..
            if (oItem.getCustomData()) {
                for (var i = 0; i < oItem.getCustomData().length; i++) {
                    var oObj = oItem.getCustomData()[i].getValue();
                    if (oObj instanceof _wnd.sap.ui.core.Item) {
                        return oObj;
                    }
                }
            }

            var iIndex = 1;
            var oPrt = oItem;
            while (oPrt) {
                oPrt = UI5ControlHelper.getParentControlAtLevel(oItem, iIndex);
                iIndex += 1;

                if (iIndex > 100) { //avoid endless loop..
                    return null;
                }

                if (oPrt && oPrt._getItemByListItem) {
                    var oCtrl = oPrt._getItemByListItem(oItem);
                    if (oCtrl) {
                        return oCtrl;
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
                if (_wnd.$("*[id$='" + oDomRef.id + oSelector.domChildWith + "']").length === 0) {
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

            if (oSelector.context) {
                var oContextsAll = UI5ControlHelper.getContexts(oItem);
                for (var sContextPropName in oSelector.context) {
                    var bFoundCntx = false;
                    for (var sCntxAll in oContextsAll) {
                        var sContext = sCntxAll === "undefined" ? undefined : sCntxAll;
                        var oCtx = oItem.getBindingContext(sContext);
                        if (oCtx && oCtx.getObject() && oCtx.getObject()[sContextPropName] === oSelector.context[sContextPropName]) {
                            bFoundCntx = true;
                            break;
                        }
                    }
                    if (!bFoundCntx) {
                        return false;
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

            if (oSelector.relativeBinding) {
                for (var sBinding in oSelector.relativeBinding) {
                    var aBndgInfoParts = UI5ControlHelper.getBindingInformation(oItem, sBinding);

                    var aMatchingValues = Object.keys(oSelector.relativeBinding[sBinding]).map(function (sKey) {
                        var mBindingInfo = aBndgInfoParts[sKey];
                        var sRelativePathSelector = oSelector.relativeBinding[sBinding][sKey];

                        // return early if a binding part does not exist actually
                        if (!mBindingInfo || !sRelativePathSelector) {
                            return false;
                        }

                        if (mBindingInfo.relativePath !== sRelativePathSelector) {
                            return false;
                        }
                        return true;
                    });
                }
                if (aMatchingValues.every((bIsMatching) => !bIsMatching)) {
                    return false;
                }
            }
            if (oSelector.binding) {
                for (var sBinding in oSelector.binding) {
                    var aBndgInfoParts = UI5ControlHelper.getBindingInformation(oItem, sBinding);

                    // inspect whether the selector is matching the various binding parts of the property 'sBinding'
                    var aMatchingValues = Object.keys(oSelector.binding[sBinding]).map(function (sKey) {
                        var mBindingInfo = aBndgInfoParts[sKey];
                        var mSelectorBindingInfo = oSelector.binding[sBinding][sKey];

                        // return early if a binding part does not exist actually
                        if (!mBindingInfo || !mSelectorBindingInfo) {
                            return false;
                        }

                        if (mBindingInfo.prefixedFullPath !== mSelectorBindingInfo.prefixedFullPath) {
                            if (oItem.getMetadata().getElementName() === "sap.m.Label") {
                                if (oItem.getParent() && oItem.getParent().getMetadata()._sClassName === "sap.ui.layout.form.FormElement") {
                                    var oParentBndg = oItem.getParent().getBinding("label");
                                    if (!oParentBndg || oParentBndg.getPath() !== oSelector.binding[sBinding].relativePath) {
                                        return false;
                                    }
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        }

                        return true;
                    });

                    // if none of the binding paths has been matched, return false immediately
                    if (aMatchingValues.every((bIsMatching) => !bIsMatching)) {
                        return false;
                    }
                }
            }

            if (oSelector.tableInfo) {
                var oTableInfo = UI5ControlHelper.getTableInformation(oItem);
                if ((typeof oSelector.tableInfo.tableCol !== "undefined" && oTableInfo.tableCol !== oSelector.tableInfo.tableCol) ||
                    (typeof oSelector.tableInfo.tableRow !== "undefined" && oTableInfo.tableRow !== oSelector.tableInfo.tableRow) ||
                    (typeof oSelector.tableInfo.insideATable !== "undefined" && oTableInfo.insideATable !== oSelector.tableInfo.insideATable) ||
                    (typeof oSelector.tableInfo.tableColId !== "undefined" && oTableInfo.tableColId !== oSelector.tableInfo.tableColId) ||
                    (typeof oSelector.tableInfo.tableColDescr !== "undefined" && oTableInfo.tableColDescr !== oSelector.tableInfo.tableColDescr)) {
                    return false;
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
            if (oSelector.property) {
                for (var sProperty in oSelector.property) {
                    if (!oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]) {
                        //property is not even available in that item.. just skip it..
                        bFound = false;
                        break;
                    }
                    //do not return objects (as certainly might be dom elements..)

                    var sPropertyValueItem = oItem["get" + sProperty.charAt(0).toUpperCase() + sProperty.substr(1)]();
                    if (typeof sPropertyValueItem === "object") {
                        continue;
                    }
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
            }
            ]
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
        // Use toString instead of _wnd.jQuery.type to catch host objects
        if (!obj || {}.toString.call(obj) !== "[object Object]") {
            return false;
        }

        var proto = Object.getPrototypeOf(obj);

        // Objects with no prototype (e.g., `Object.create( null )`) are plain
        if (!proto) {
            return true;
        }

        // Objects with a prototype are considered plain only if they were constructed by a global Object function
        var Ctor = {}.hasOwnProperty.call(proto, "constructor") && proto.constructor;
        return typeof Ctor === "function" && {}.hasOwnProperty.toString.call(Ctor) === {}.hasOwnProperty.toString.call(Object);
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
         * The code in this function is taken from jQuery 3.4.1 "_wnd.jQuery.extend" and got modified.
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
                if (copy === undefined || target === copy || key === "__proto__" || typeof copy === "function" || typeof src === "function") {
                    continue;
                }

                // recurse if merging plain objects or arrays
                if (copy && (isPlainObject(copy) || Array.isArray(copy))) {

                    if (Array.isArray(copy)) {
                        clone = src && Array.isArray(src) ? src : [];
                    } else {
                        clone = src && isPlainObject(src) ? src : {};
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
        _bPageLocked = false,
        _oDialog = null,
        oLastDom = null;

    var _oPageLockBusyDialog;

    function lockPage() {
        _bPageLocked = true;

        if (_oPageLockBusyDialog) {
            _oPageLockBusyDialog.open();
        }
    }

    function unlockPage() {
        _bPageLocked = false;

        if (_oPageLockBusyDialog) {
            _oPageLockBusyDialog.close();
        }
    }

    /**
     * Highlight the given DOM element of a control on the site using CSS classes.
     *
     * @param {HTMLElement} oDOMNode the corresponding selected DOM node
     */
    function revealDOMNode(oDOMNode) {
        // 1) remove all previously enabled highlightings
        var prevFoundElements = _wnd.document.getElementsByClassName("UI5TR_ControlFound");
        Array.prototype.forEach.call(prevFoundElements, function (oElement) {
            oElement.classList.remove("UI5TR_ControlFound");
        });

        // 2) do not add CSS classes if there is no DOM node
        if (!oDOMNode) {
            return;
        }

        // 2) highlight the new element
        oDOMNode.classList.add("UI5TR_ControlFound");
    }

    // #endregion

    // #region Initialization

    function _loadCss() {
        _wnd.$("<style type='text/css'>.UI5TR_ElementHover,\
            .UI5TR_ElementHover * {\
                background: rgba(193, 137, 156,0.5)!important;\
            }\
            \
                .UI5TR_ControlFound,\
            .UI5TR_ControlFound * {\
                background: rgba(113, 148, 175,0.5)!important;\
            }\
            \
            #UI5TR_BusyDialog - Dialog.sapUiLocalBusyIndicatorAnimation > div:: before {\
            \
            background: #a01441; \
        } \
        </style > ").appendTo("head");
    }

    function checkPageForUI5() {
        var oData = {};
        var iFrames = document.getElementsByTagName("iframe");
        for (var i = 0; i < iFrames.length; i++) {
            if (iFrames[i].contentWindow && iFrames[i].contentWindow.sap) {
                _wnd = iFrames[i].contentWindow;
                break;
            }
        }
        if (_wnd.sap && _wnd.sap.ui) {
            oData.status = "success";

            // Get framework version
            try {
                oData.version = _wnd.sap.ui.getVersionInfo().version;
            } catch (e) {
                oData.version = _wnd.sap.ui.version; //fallback..
            }

            // Get framework name
            try {
                var versionInfo = _wnd.sap.ui.getVersionInfo();

                // Use group artifact version for maven builds or name for other builds (like SAPUI5-on-ABAP)
                var frameworkInfo = versionInfo.gav ? versionInfo.gav : versionInfo.name;

                oData.name = frameworkInfo.indexOf('openui5') !== -1 ? 'OpenUI5' : 'SAPUI5';
            } catch (e) {
                oData.name = 'UI5';
            }

            // Check if the version is supported
            oData.isVersionSupported = !!_wnd.sap.ui.require;

            if (oData.isVersionSupported) {
                //load css...
                _loadCss();
            }

        } else {
            oData.status = "error";
        }
        return oData;
    }

    function initializePage() {
        const maxWaitTime = 3000;
        var waited = 0;
        console.log('- checking UI5 appearance...');
        var intvervalID = setInterval(function () {
            waited = waited + 100;
            if (waited % 500 === 0) {
                console.log(`- checking UI5 appearance (${waited / 1000.0})...`);
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
        // create a BusyDialog for screen locking
        _wnd.sap.ui.require(["sap/m/BusyDialog"], function (BusyDialog) {
            _oPageLockBusyDialog = new BusyDialog("UI5TR_BusyDialog", {
                title: "Finalize test step",
                text: "Waiting until user saves test step in test-recorder popup..."
            });
        }.bind(this));

        //setup listener for messages from the Extension
        PageCommunication.getInstance().start();
        PageListener.getInstance().setupPageListener();
    }

    // Finished setting up the coding now check if UI5 is loaded on the page.
    console.log("- UI5-Testrecorder code appended");
    initializePage();

    // #endregion

}());