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
  /* document.onmousedown = (e) => {
    let event = e || window.event;
    let el = event.target || event.srcElement;
    let ui5El = _getUI5Element(el);
    ws_api.send_record_step({
      type: 'clicked',
      control: {
        id: ui5El.sId,
        type: ui5El.getMetadata().getElementName(),
        classes: ui5El.aCustomStyleClasses,
        properties: _getUI5ElementProperties(ui5El)
      },
      location: window.location.href
    })
    return false;
  } */

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
        /* domRef: ui5El.getDomRef().outerHTML, */
        properties: _getUI5ElementProperties(ui5El),
        view: _getViewProperties(ui5El)
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
              properties: _getUI5ElementProperties(ui5El),
              view: _getViewProperties(ui5El)
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
      const key = lowerCaseFirstLetter(b.replace('get', ''));
      const value = el[b]();
      if (typeof value !== 'object') {
        a[key] = value;
      } else {
        try {
          JSON.stringify(value);
          a[key] = value;
        } catch (e) { }
      }
      return a;
    }, {})
}

const executeAction = (oEvent) => {
  const oItem = oEvent.step;
  let elements = _getUI5Elements();
  // filter by control_type
  elements = Object.values(elements).filter(el => el.getMetadata().getElementName() === oItem.control_type);
  // filter by control_attributes
  elements = elements.filter(el => {
    return Object.entries(oItem.control_attributes)
      // create getter function names and expected values from control_attributes
      .map(attributeEntry => ({ key: 'get' + upperCaseFirstLetter(attributeEntry[0]), value: attributeEntry[1] }))
      // create list of expection-results
      .map(executeMatcher => el[executeMatcher.key]() === executeMatcher.value)
      // check if all selected attributes really match
      .reduce((a, b) => a && b, true)
  });

  if (elements.length === 1) {
    switch (oItem.action_type) {
      case "clicked":
        _executeClick(elements[0]);
        break;
    }
  } else {
    console.log('Elements length: ', elements.length);
  }

}

const _executeClick = (el) => {
  const mouseDownEvent = new MouseEvent('mousedown', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  mouseDownEvent.originalEvent = mouseDownEvent; //self refer

  var mouseUpEvent = new MouseEvent('mouseup', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  mouseUpEvent.originalEvent = mouseUpEvent; //self refer

  var clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  clickEvent.originalEvent = clickEvent;

  el.getDomRef().dispatchEvent(mouseDownEvent);
  el.getDomRef().dispatchEvent(mouseUpEvent);
  el.getDomRef().dispatchEvent(clickEvent);
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

const _getViewProperties = (ui5El) => {
  let curEl = ui5El;
  debugger;
  while (!curEl.getViewName) {
    curEl = curEl.getParent();
  }

  return {
    absoluteViewName: curEl.getViewName(),
    relativeViewName: curEl.getViewName().split(".").pop()
  };
}

const lowerCaseFirstLetter = ([first, ...rest], locale = navigator.language) => {
  return first === undefined ? '' : first.toLocaleLowerCase(locale) + rest.join('');
}

const upperCaseFirstLetter = ([first, ...rest], locale = navigator.language) => {
  return first === undefined ? '' : first.toLocaleUpperCase(locale) + rest.join('');
}

setupAll();
