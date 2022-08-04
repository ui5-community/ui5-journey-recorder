var lastDetectedElement;
var eventsLogged = [];

var setupAll = () => {
  setupHoverSelectEffect();
  setupClickListener();
}

var setupHoverSelectEffect = () => {
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

var setupClickListener = () => {
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
    console.dir(`Onclick > ${ui5El}`);
    eventsLogged.push({
      type: 'clicked',
      control: ui5El,
      location: window.location.href,
      event: event
    });
    ws_api.send_record_step({
      type: 'clicked',
      control: {
        id: ui5El.sId,
        classes: ui5El.aCustomStyleClasses,
        domRef: ui5El.getDomRef().outerHTML
      },
      location: window.location.href
    })
    if (ui5El && ui5El.focus) {
      ui5El.focus();
      for (let child of ui5El.getDomRef().querySelectorAll('input, select, textarea')) {
        child.onkeydown = (e) => {
          eventsLogged.push({
            type: 'keypress',
            control: ui5El,
            location: window.location.href,
            event: e
          });

          ws_api.send_record_step({
            type: 'keypress',
            key: e.key,
            keyCode: e.keyCode,
            control: {
              id: ui5El.sId,
              classes: ui5El.aCustomStyleClasses,
              domRef: ui5El.getDomRef().outerHTML
            },
            location: window.location.href
          });
        }
      }
    }
  }
}

var getTestSteps = () => {
  return eventsLogged;
}

var _getElements_pre_1_67 = () => {
  let core;
  const fakePlugin = {
    startPlugin: realCore => core = realCore,
    stopPlugin: _ => { }
  };

  sap.ui.getCore().registerPlugin(fakePlugin);
  sap.ui.getCore().unregisterPlugin(fakePlugin);
  return core.mElements;
}

var _getElements_1_67_and_post = () => {
  return sap.ui.core.Element.registry.all();
}

var _getUI5Elements = () => {
  //>= 1.67
  if (sap.ui.core.Element && sap.ui.core.Element.registry) {
    return _getElements_1_67_and_post();
  } else {
    return _getElements_pre_1_67();
  }
}

var _getElements_pre_1_67 = () => {
  let core;
  const fakePlugin = {
    startPlugin: realCore => core = realCore,
    stopPlugin: _ => { }
  };

  sap.ui.getCore().registerPlugin(fakePlugin);
  sap.ui.getCore().unregisterPlugin(fakePlugin);
  return core.mElements;
}

var _getElements_1_67_and_post = () => {
  return sap.ui.core.Element.registry.all();
}

var _getUI5Elements = () => {
  //>= 1.67
  if (sap.ui.core.Element && sap.ui.core.Element.registry) {
    return _getElements_1_67_and_post();
  } else {
    return _getElements_pre_1_67();
  }
}

var _getUI5Element = (el) => {
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
    if (ui5El) {
      console.log('UI5El found: ' + ui5El.getId());
    }
  }
  return ui5El
}

setupAll();
