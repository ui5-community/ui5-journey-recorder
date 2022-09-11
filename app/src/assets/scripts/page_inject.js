(() => {
  class RecorderInject {
    #lastDetectedElement;

    //#region public access points
    setupHoverSelectEffect() {//append style class
      let css = '.injectClass { box-shadow: 0 0 2px 2px red, inset 0 0 2px 2px red; }';
      let head = document.head || document.getElementsByTagName('head')[0];
      let style = document.createElement('style');

      style.id = "UI5TR--css";
      style.appendChild(document.createTextNode(css));

      head.prepend(style);

      //append style adding and removement
      document.onmouseover = e => {
        var e = e || window.event;
        var el = e.target || e.srcElement;
        var ui5El = this.#getUI5Element(el);

        if (ui5El && ui5El.addStyleClass) {
          ui5El.addStyleClass('injectClass');
        }

        if (this.#lastDetectedElement && this.#lastDetectedElement.removeStyleClass && ui5El && this.#lastDetectedElement.getId() !== ui5El.getId()) {
          this.#lastDetectedElement.removeStyleClass('injectClass');
        }
        this.#lastDetectedElement = ui5El;
      }

      document.onmouseout = e => {
        var e = e || window.event;
        var el = e.target || e.srcElement;
        var ui5El = this.#getUI5Element(el);

        if (ui5El && ui5El.removeStyleClass) {
          ui5El.removeStyleClass('injectClass');
        }
      };
    }

    setupClickListener() {
      document.onclick = (e) => {
        let event = e || window.event;
        let el = event.target || event.srcElement;
        let ui5El = this.#getUI5Element(el);
        const webSocket = window?.ui5TestRecorder?.communication?.webSocket;
        if (webSocket) {
          webSocket.send_record_step({
            type: 'clicked',
            control: {
              id: ui5El.sId,
              type: ui5El.getMetadata().getElementName(),
              classes: ui5El.aCustomStyleClasses,
              properties: this.#getUI5ElementProperties(ui5El),
              view: this.#getViewProperties(ui5El),
              events: {
                press: ui5El.getMetadata().getEvent('press') !== undefined
              }
            },
            location: window.location.href
          });

          if (ui5El && ui5El.focus) {
            ui5El.focus();
            for (let child of ui5El.getDomRef().querySelectorAll('input, select, textarea')) {
              child.onkeydown = (e) => {
                webSocket.send_record_step({
                  type: 'keypress',
                  key: e.key,
                  keyCode: e.keyCode,
                  control: {
                    id: ui5El.sId,
                    type: ui5El.getMetadata().getElementName(),
                    classes: ui5El.aCustomStyleClasses,
                    domRef: ui5El.getDomRef().outerHTML,
                    properties: this.#getUI5ElementProperties(ui5El),
                    view: this.#getViewProperties(ui5El)
                  },
                  location: window.location.href
                });
              }
            }
          }
        } else {
          console.error('UI5-Testrecorder: ', 'No communication websocket found!');
        }
      }
    }

    getElementsForId(id) {
      return Object.values(this.#getUI5Elements()).filter(el => el.getId() === id);
    }

    getElementsByAttributes(controlType, attributes) {
      let elements = this.#getUI5Elements();
      // filter by control_type
      elements = Object.values(elements).filter(el => el.getMetadata().getElementName() === controlType);
      // filter by control_attributes
      elements = elements.filter(el => {
        return attributes
          // create getter function names and expected values from control_attributes
          .map(attribute => ({ key: 'get' + Utils.upperCaseFirstLetter(attribute.name), value: attribute.value }))
          // create list of expection-results
          .map(executeMatcher => el[executeMatcher.key]() === executeMatcher.value)
          // check if all selected attributes really match
          .reduce((a, b) => a && b, true);
      });
      return elements;
    }

    executeAction(oEvent) {
      const oItem = oEvent.step;
      let elements = this.#getUI5Elements();
      elements = this.getElementsByAttributes(oItem.control_type, Object.values(oItem.control_attributes)
        // only take the attributes which should be used for identification
        .filter(att => att.use));

      if (elements.length > 1 && !oItem.control_id.startsWith('__')) {
        elements = elements.filter(el => el.getId() === oItem.control_id);
      }

      if (elements.length === 1) {
        switch (oItem.action_type) {
          case "clicked":
            this.#executeClick(elements[0]);
            break;
        }
      } else {
        console.log('Elements length: ', elements.length);
      }
    }
    //#endregion public access points

    //#region private
    #getUI5Element(el) {
      let UIElements = this.#getUI5Elements();
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

    #getUI5Elements() {
      //>= 1.67
      if (sap.ui.core.Element && sap.ui.core.Element.registry) {
        return this.#getElements_1_67_and_post();
      } else {
        return this.#getElements_pre_1_67();
      }
    }

    #getElements_pre_1_67() {
      let core;
      const fakePlugin = {
        startPlugin: realCore => core = realCore,
        stopPlugin: _ => { }
      };

      sap.ui.getCore().registerPlugin(fakePlugin);
      sap.ui.getCore().unregisterPlugin(fakePlugin);
      return core.mElements;
    }

    #getElements_1_67_and_post() {
      return sap.ui.core.Element.registry.all();
    }

    #getUI5ElementProperties(el) {
      // retrieve the direct public available methods
      return el.getMetadata()._aPublicMethods
        // reduce them to the "getter" only
        .filter(m => m.startsWith("get"))
        // create the properties object by collect and execute all getter
        .reduce((a, b) => {
          const key = Utils.lowerCaseFirstLetter(b.replace('get', ''));
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

    #getViewProperties(ui5El) {
      let curEl = ui5El;
      while (curEl && !curEl.getViewName) {
        curEl = curEl.getParent();
      }
      if (!curEl) {
        //assume we have ui5 element and can go upwards by substracting the last part of the id to get the information
        const newId = ui5El.getId().substring(0, ui5El.getId().lastIndexOf('-'));
        curEl = this.#getUI5Elements()[newId];
        while (curEl && !curEl.getViewName) {
          curEl = curEl.getParent();
        }
      }

      return {
        absoluteViewName: curEl.getViewName(),
        relativeViewName: curEl.getViewName().split(".").pop()
      };
    }

    #executeClick(el) {
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

    //#endregion
  }

  class Utils {
    static lowerCaseFirstLetter([first, ...rest], locale = navigator.language) {
      return first === undefined ? '' : first.toLocaleLowerCase(locale) + rest.join('');
    }

    static upperCaseFirstLetter = ([first, ...rest], locale = navigator.language) => {
      return first === undefined ? '' : first.toLocaleUpperCase(locale) + rest.join('');
    }
  }

  const recorderInstance = new RecorderInject(document, window);
  recorderInstance.setupHoverSelectEffect();
  recorderInstance.setupClickListener();

  window.ui5TestRecorder = {
    ...window.ui5TestRecorder,
    ... {
      recorder: recorderInstance,
      utils: new Utils()
    }
  }
})();
