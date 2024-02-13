(() => {
  class RecorderInject {
    #lastDetectedElement;
    #rr;
    #toast;

    constructor() {
      try {
        this.#rr = sap.ui.requireSync('sap/ui/test/RecordReplay');
      } catch (e) {
        this.#rr = null;
      }
      try {
        this.#toast = sap.ui.requireSync('sap/m/MessageToast');
      } catch (e) {
        this.#toast = null;
      }
    }

    //#region public access points
    setupHoverSelectEffect() {//append style class
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
          const message = {
            type: 'clicked',
            control: {
              id: ui5El.sId,
              type: ui5El.getMetadata().getElementName(),
              classes: ui5El.aCustomStyleClasses,
              properties: this.#getUI5ElementProperties(ui5El),
              bindings: this.#getUI5ElementBindings(ui5El),
              view: this.#getViewProperties(ui5El),
              events: {
                press: ui5El.getMetadata().getEvent('press') !== undefined || ui5El.getMetadata().getEvent('click') !== undefined
              }
            },
            location: window.location.href
          }
          this.#rr.findControlSelectorByDOMElement({ domElement: ui5El.getDomRef() }).then((c) => {
            message.control.recordReplaySelector = c;
            webSocket.send_record_step(message);
          }).catch(err => { console.log(err.message) });

          if (ui5El && ui5El.focus) {
            ui5El.focus();
            let childs = ui5El.getDomRef().querySelectorAll('input, select, textarea');
            if (childs.length === 0 && ui5El.getDomRef().shadowRoot) {
              childs = ui5El.getDomRef().shadowRoot.querySelectorAll('input, select, textarea');
            }
            for (let child of childs) {
              child.onkeypress = (e) => {
                const key_message = {
                  type: 'keypress',
                  key: e.key,
                  keyCode: e.keyCode,
                  control: {
                    id: ui5El.sId,
                    type: ui5El.getMetadata().getElementName(),
                    classes: ui5El.aCustomStyleClasses,
                    properties: this.#getUI5ElementProperties(ui5El),
                    bindings: this.#getUI5ElementBindings(ui5El),
                    view: this.#getViewProperties(ui5El),
                    events: {
                      press: ui5El.getMetadata().getEvent('press') !== undefined
                    }
                  },
                  location: window.location.href
                }
                this.#rr.findControlSelectorByDOMElement({ domElement: ui5El.getDomRef() }).then((c) => {
                  key_message.control.recordReplaySelector = c;
                  webSocket.send_record_step(key_message);
                }).catch(err => { console.log(err.message) });
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

    getElementsBySelectors(controlSelectors) {
      let elements = this.#getUI5Elements();
      // filter by control_type
      elements = Object.values(elements).filter(el => el.getMetadata().getElementName() === controlSelectors.control_type);
      // filter by control.properties
      elements = elements.filter(el => {
        const byProperties = controlSelectors.properties
          // only take the properties which should be used for identification
          .filter(p => p.use)
          // create getter function names and expected values from control.properties
          .map(attribute => ({ key: 'get' + Utils.upperCaseFirstLetter(attribute.name), value: attribute.value }))
          // create list of expection-results
          .map(executeMatcher => el[executeMatcher.key]() === executeMatcher.value)
          // check if all selected attributes really match
          .reduce((a, b) => a && b, true);

        const byBindings = controlSelectors.bindings.filter(b => b.use)
          .map(b => {
            const info = el.mBindingInfos[b.propertyName];
            if (!info) {
              return false;
            }
            if (info.parts.length === 1) {
              if (info.parts[0].path !== b.propertyPath) {
                return false;
              }
              if (!info.binding || !info.binding.oContext || !(info.binding.oContext.sPath !== b.modelPath)) {
                return false;
              }
              if (!info.binding || !info.binding.oValue !== b.bindingValue) {
                return false;
              }
            } else if (info.parts.length > 1) {
              const contains = info.parts.find(p => b.propertyPath === p.path);
              if (!contains) {
                return false;
              }
              const parting = info.binding.aBindings.find(ab => ab.sPath === b.propertyPath);
              if (!parting) {
                return false;
              }
              if (parting.oValue !== b.bindingValue) {
                return false;
              }
            }
            return true;
          })
          .reduce((a, b) => a && b, true);

        const byI18ns = controlSelectors.i18nTexts.filter(i18nT => i18nT.use)
          .map(i18n => {
            const info = el.mBindingInfos[i18n.propertyName];
            if (!info) {
              return false;
            }

            if (info.parts.length === 1) {
              if (info.parts[0].path !== b.propertyPath && info.parts[0].model !== 'i18n') {
                return false;
              }
              if (!info.binding || !info.binding.oContext || !(info.binding.oContext.sPath !== b.modelPath)) {
                return false;
              }
              if (!info.binding || !info.binding.oValue !== b.bindingValue) {
                return false;
              }
            } else if (info.parts.length > 1) {
              //adding an additional filter to find only 'i18n' bindings
              const contains = info.parts.filter(p => p.model && p.model === 'i18n').find(p => b.propertyPath === p.path);

              if (!contains) {
                return false;
              }
              const parting = info.binding.aBindings.find(ab => ab.sPath === b.propertyPath);
              if (!parting) {
                return false;
              }
              if (parting.oValue !== b.bindingValue) {
                return false;
              }
            }
            return true;
          })
          .reduce((a, b) => a && b, true);
        return byProperties && byBindings && byI18ns;
      });
      return elements;
    }

    executeAction(oEvent) {
      if (this.#rr) {
        //only for RecordReplay possible to select to use selectors or not
        return this.#executeByRecordReplay(oEvent.step, oEvent.useSelectors);
      } else {
        return this.#executeByPure(oEvent.step);
      }
    }

    #executeByRecordReplay(oItem, bUseSelectors) {
      const oSelector = bUseSelectors ? this.#createSelectorFromItem(oItem) : oItem.record_replay_selector;

      switch (oItem.action_type) {
        case "clicked":
          return this.#rr.interactWithControl({
            selector: oSelector,
            interactionType: this.#rr.InteractionType.Press
          })
        case 'validate':
          return this.#rr.findAllDOMElementsByControlSelector({
            selector: oSelector
          }).then(result => {
            if (result.length > 1) {
              throw new Error();
            }
            return;
          });
        case 'input':
          return this.#rr.interactWithControl({
            selector: oSelector,
            interactionType: this.#rr.InteractionType.EnterText,
            enterText: oItem.keys.reduce((a, b) => a + b.key_char, '')
          })
        default:
          return Promise.reject('ActionType not defined');
      }
    }

    #createSelectorFromItem(oItem) {
      const oSelector = {};
      if (oItem.control.control_id.use) {
        oSelector['id'] = oItem.control.control_id.id;
        return oSelector;
      }
      oSelector['controlType'] = oItem.control.control_type;
      if (oItem.control.bindings) {
        const bindings = oItem.control.bindings.filter(b => b.use);
        if (bindings.length === 1) {
          oSelector['bindingPath'] = { path: bindings[0].modelPath, propertyPath: bindings[0].propertyPath }
        }
      }
      if (oItem.control.i18nTexts) {
        const i18ns = oItem.control.i18nTexts.filter(b => b.use);
        if (i18ns.length === 1) {
          oSelector['i18NText'] = { key: i18ns[0].propertyPath, propertyName: i18ns[0].propertyName }
        }
      }
      //just a current workaround
      if (oItem.record_replay_selector.viewId) {
        oSelector['viewId'] = oItem.record_replay_selector.viewId;
      }
      return oSelector;
    }

    #executeByPure(oItem) {
      let elements = this.#getUI5Elements();
      if (oItem.control.control_id.use) {
        elements = elements.filter(el => el.getId() === oItem.control.control_id);
      } else {
        elements = this.getElementsBySelectors(oItem.control);
      }

      if (elements.length !== 1) {
        return Promise.reject();
      }

      switch (oItem.action_type) {
        case "clicked":
          this.#executeClick(elements[0].getDomRef());
          return Promise.resolve();
        case "validate":
          return Promise.resolve();
        case "input":
          this.#executeTextInput(elements[0], oItem);
          return Promise.resolve();
        default:
          return Promise.reject(`Action Type (${oItem.action_type}) not defined`);
      }
    }

    showToast(sMessage, props) {
      this.#toast.show(sMessage, props);
    }

    getUI5Version() {
      return sap.ui.version;
    }
    //#endregion public access points

    //#region private
    #getUI5Element(el) {
      let UIElements = this.#getUI5Elements();
      var ui5El = UIElements[el.id];
      //check if we found an ui5 element and if this contains a parent.
      //otherwise it is a nested property and not usable for testing
      if (!ui5El || (ui5El && !ui5El.getParent())) {
        let parent = el;
        let found = false;
        while (!found) {
          if (parent && UIElements[parent.id] && UIElements[parent.id].getParent() && UIElements[parent.id].addStyleClass) {
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

    #getUI5ElementBindings(el) {
      return Object.keys(el.mBindingInfos)
        .map(k => {
          let first = el.mBindingInfos[k].parts.map(b => {
            const c = {};
            c.key = k;
            c.i18n = b.model === 'i18n';
            c.propertyPath = b.path;
            c.model = b.model;
            return c;
          });
          if (first.length > 1) {
            first = first.map(f => {
              const binding = el.mBindingInfos[f.key].binding.aBindings.find(ab => ab.sPath === f.propertyPath);
              if (binding) {
                f.modelPath = binding.oContext?.sPath;
                f.value = binding.oValue;
              }
              return f;
            })
          } else if (first.length === 1) {
            const binding = el.mBindingInfos[first[0].key].binding;
            if (binding) {
              first[0].modelPath = binding.oContext?.sPath;
              first[0].value = binding.oValue;
            }
          }

          return first;
        })
        .reduce((b, a) => [...a, ...b], []);
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
        absoluteViewName: curEl?.getViewName() || '',
        relativeViewName: curEl?.getViewName().split(".").pop() || ''
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

      el.dispatchEvent(mouseDownEvent);
      el.dispatchEvent(mouseUpEvent);
      el.dispatchEvent(clickEvent);
    }

    #executeTextInput(ui5El, oItem) {
      const domNode = ui5El.getDomRef();
      const sText = oItem.keys.reduce((a, b) => a + b.key_char, '');
      domNode.val(sText);

      var event = new KeyboardEvent('input', {
        view: window,
        data: sText,
        bubbles: true,
        cancelable: true,
      });
      event.originalEvent = event;
      domNode.dispatchEvent(event);
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
  recorderInstance.showToast("UI5 Journey Recorder successfully injected", {
    duration: 2000,
    autoClose: true
  })

  window.ui5TestRecorder = {
    ...window.ui5TestRecorder,
    ... {
      recorder: recorderInstance,
      utils: new Utils()
    }
  }
})();
