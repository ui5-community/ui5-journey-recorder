var lastDetectedElement;

const setupAll = () => {
  setupHoverSelectEffect();
  setupClickListener();
}

const setupHoverSelectEffect = () => {
  //append style class
  let css = '.injectClass { box-shadow: 0 0 2px 2px red, inset 0 0 2px 2px red; }';
  let head = document.head || document.getElementsByTagName('head')[0];
  let style = document.createElement('style');

  style.id = "UI5TR--css";
  style.appendChild(document.createTextNode(css));

  head.appendChild(style);

  //append style adding and removement
  document.onmouseover = e => {
    var e = e || window.event;
    var el = e.target || e.srcElement;
    var ui5El = _getUI5Element(el);

    if (ui5El && ui5El.addStyleClass) {
      ui5El.addStyleClass('injectClass');
    }

    if (lastDetectedElement && lastDetectedElement.removeStyleClass && ui5El && lastDetectedElement.getId() !== ui5El.getId()) {
      lastDetectedElement.removeStyleClass('injectClass');
    }
    lastDetectedElement = ui5El;
  }

  document.onmouseout = function (e) {
    var e = e || window.event;
    var el = e.target || e.srcElement;
    var ui5El = _getUI5Element(el);

    if (ui5El && ui5El.removeStyleClass) {
      ui5El.removeStyleClass('injectClass');
    }
  };
}

const setupClickListener = () => {
  document.onmousedown = (e) => {
    let event = e || window.event;
    let el = event.target || event.srcElement;
    //let ui5El = _getUI5Element(el);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    //console.dir(`OnMouseDown > ${ui5El}`);
  }

  document.onclick = (e) => {
    let event = e || window.event;
    let el = event.target || event.srcElement;
    let ui5El = _getUI5Element(el);
    /* event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation(); */
    /* console.dir(`Onclick > ${ui5El}`); */
    ws_api.send_record_step({
      type: 'clicked',
      control: {
        id: ui5El.sId,
        type: ui5El.getMetadata().getElementName(),
        classes: ui5El.aCustomStyleClasses,
        domRef: ui5El.getDomRef().outerHTML,
        properties: _getUI5ElementProperties(ui5El)
      },
      location: window.location.href
    })
    if (ui5El && ui5El.focus) {
      ui5El.focus();
      for (let child of ui5El.getDomRef().querySelectorAll('input, select, textarea')) {
        child.onkeydown = (e) => {
          ws_api.send_record_step({
            type: 'keypress',
            key: e.key,
            keyCode: e.keyCode,
            control: {
              id: ui5El.sId,
              type: ui5El.getMetadata().getElementName(),
              classes: ui5El.aCustomStyleClasses,
              domRef: ui5El.getDomRef().outerHTML,
              properties: _getUI5ElementProperties(ui5El)
            },
            location: window.location.href
          });
        }
      }
    }
  }
}

const _getElements_pre_1_67 = () => {
  let core;
  const fakePlugin = {
    startPlugin: realCore => core = realCore,
    stopPlugin: _ => { }
  };

  sap.ui.getCore().registerPlugin(fakePlugin);
  sap.ui.getCore().unregisterPlugin(fakePlugin);
  return core.mElements;
}

const _getElements_1_67_and_post = () => {
  return sap.ui.core.Element.registry.all();
}

const _getUI5Elements = () => {
  //>= 1.67
  if (sap.ui.core.Element && sap.ui.core.Element.registry) {
    return _getElements_1_67_and_post();
  } else {
    return _getElements_pre_1_67();
  }
}

const _getUI5Element = (el) => {
  let UIElements = _getUI5Elements();
  var ui5El = UIElements[el.id];
  if (!ui5El) {
    let parent = el;
    let found = false;
    while (!found) {
      if (parent && UIElements[parent.id] && UIElements[parent.id].addStyleClass) {
        found = true;
        ui5El = UIElements[parent.id];
      }
      parent = parent.parentNode;
      if (!parent) {
        break;
      }
    }
    /* if (ui5El) {
      console.log('UI5El found: ' + ui5El.getId());
    } */
  }
  return ui5El
}

const _getUI5ElementProperties = (el) => {
  // retrieve the direct public available methods
  return el.getMetadata()._aPublicMethods
    // reduce them to the "getter" only
    .filter(m => m.startsWith("get"))
    // create the properties object by collect and execute all getter
    .reduce((a, b) => {
      a[lowerCaseFirstLetter(b.replace('get', ''))] = el[0][b]();
      return a;
    }, {})
}

const executeAction = (oEvent) => {
  const oItem = oEvent.step;
  var oDOMNodeCandidates = getDomForControl(oItem);
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
  var oControl = getControlFromDom(oDOMNode);

  // reveal DOM node by using CSS classes and add fade-out effect
  /* revealDOMNode(oDOMNode);
  setTimeout(function () {
    revealDOMNode(null);
  }, 500); */

  // for mouse-press events
  if (oItem.property.actKey === "PRS") {

    aEvents.push(new Promise(function (resolve, reject) {
      var Press = null;
      try {
        Press = window.sap.ui.requireSync("sap/ui/test/actions/Press");
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
          EnterText = window.sap.ui.requireSync("sap/ui/test/actions/EnterText");
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

const getDomForControl = (oControlData) => {
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

const __checkActionPreconditions = (aDOMNodes, bReturnSelectedNode = false) => {

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

const lowerCaseFirstLetter = ([first, ...rest], locale = navigator.language) =>
  first === undefined ? '' : first.toLocaleLowerCase(locale) + rest.join('')

setupAll();
