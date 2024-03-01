(() => {
  class API {
    static own_id = "ui5_tr_handler";
    static key_ident = `(\\(\\S+\\))?`;
    static nav_prop = `(\\/\\S+)?`;

    #root = "";
    #getter_expr = [];
    #post_expr = [];
    #getter_routes = [];
    #post_routes = [];

    webSocket;

    /**
     * Constructor of the API
     *
     * @param {string} [sRoot] optional root path, used as prefix bevor every route
     */
    contructor(sRoot) {
      this.#root = sRoot || "";
    }

    //#region public
    /**
     * Set a getter route for the api
     *
     * @param {string} sRoute which should be handled
     * @param {function(req,res)=>void} callback function handling calls to the route
     */
    get(sRoute, callback) {
      const map_id = this.#getter_expr.length;
      const { route, pars } = this.#prepareRoute(sRoute);

      const prefix = this.#root + route;
      const regexp = new RegExp(`((${prefix})((\\?\\S+)$)?)$`, 'gm');

      this.#getter_expr.push({ regex: regexp, id: map_id, paramList: pars });
      this.#getter_routes[map_id] = callback;
    }

    /**
     * Set a post route for the api
     *
     * @param {string} sRoute
     * @param {function(req,res)=>void} callback function handling calls to the route
     */
    post(sRoute, callback) {
      const prefix = this.#root + sRoute;
      const regexp = new RegExp(`(${prefix})${API.key_ident}${API.nav_prop}`, 'gm');
      const map_id = this.#post_expr.length;
      this.#post_expr.push({ regex: regexp, id: map_id });
      this.#post_routes[map_id] = callback;
    }

    /**
     * Start the api and use the listener id as filter for all message events
     *
     * @param {string} sListenerId for the "message" events to listen on {event.data.origin}
     */
    listen(sListenerId) {
      const page_origin = new URL(location.href).origin;

      window.addEventListener("message", (oEvent) => {
        if (oEvent.origin === page_origin && oEvent.data.origin === sListenerId) {
          this.#handleEvent(oEvent, sListenerId);
        }
      });

      this.webSocket = {
        send_record_step: (step) => {
          window.postMessage({
            origin: `${sListenerId}_${API.own_id}`,
            message: {
              instantType: 'record-token',
              content: step
            }
          });
        },
        send_instant_message: (sMsg) => {
          window.postMessage({
            origin: `${sListenerId}_${API.own_id}`, message: {
              instantType: 'instant',
              content: sMsg
            }
          })
        }
      }
    }
    //#endregion public
    //#region private
    #prepareRoute(sRoute) {
      const pathParamIdentifier = /\<([a-zA-Z0-9])+\>/gm;
      const pathParams = [];
      const matches = sRoute.match(pathParamIdentifier);
      let enclosingEnd = '';
      let enclosingFront = '';
      if (matches) {
        matches.forEach((par, i) => {
          const paramName = par.replace('<', '').replace('>', '');
          sRoute = sRoute.replace(par, '%*');
          const front = sRoute.indexOf('%');
          const end = sRoute.indexOf('*');
          const len = sRoute.length;
          if (end - 1 === len) {
            sRoute += "$";
          } else {
            enclosingEnd = sRoute[end + 1];
            sRoute = sRoute.substring(0, end + 1) + '\\' + sRoute.substring(end + 1);
          }
          if (front === 0) {
            sRoute = '^' + sRoute;
          } else {
            enclosingFront = sRoute[front - 1];
            sRoute = sRoute.substring(0, front - 1) + '\\' + sRoute.substring(front - 1)
          }

          pathParams.push({ index: i, name: paramName, encFront: enclosingFront, encEnd: enclosingEnd });

          sRoute = sRoute.replaceAll('%*', "([a-zA-Z0-9'-])+");
        });
        return { route: sRoute, pars: pathParams };
      } else {
        return { route: sRoute, pars: pathParams };
      }
    }

    #handleEvent(oEvent, sExt_id) {
      const answer_origin = `${sExt_id}_${API.own_id}`;
      const event_id = oEvent?.data?.message_id;
      const req_type = oEvent?.data?.method;

      switch (req_type) {
        case 'GET':
          this.#handleGet(oEvent?.data, this.#provideResponseCallback(event_id, answer_origin));
          break;
        case 'POST':
          this.#handlePost(oEvent?.data, this.#provideResponseCallback(event_id, answer_origin))
          break;
        default:
          this.#provideResponseCallback(event_id, answer_origin)({ status: 501, error: `Request type (${req_type}) not provided` });
      }
    }

    #provideResponseCallback(event_id, answer_origin) {
      return (oResponseData) => {
        window.postMessage({ origin: answer_origin, response: { message_id: event_id, ...oResponseData } });
      };
    }

    #handleGet(oEventData, res) {
      const url = oEventData.url;
      if (!url) {
        res({ status: 400, error: `Bad Request no url provided!` });
        return;
      }
      const url_obj = new URL(`http://${API.own_id}/${url}`);

      const handler = this.#getter_expr.find(r => r.regex.test(decodeURIComponent(url_obj.pathname)));
      if (!handler) {
        res({ status: 404, error: `The requested ressource does not exist!` });
        return;
      }
      //reset the regex because of the global 'g' modifier
      this.#getter_expr.forEach(r => r.regex.lastIndex = 0);
      const req = {}
      req.pathParams = this.#retrievePathParameters(url, handler);

      req.searchParams = {};
      for (var spkey of url_obj.searchParams.keys()) {
        req.searchParams[spkey] = url_obj.searchParams.get(spkey);
      }

      req.url = url;

      this.#getter_routes[handler.id](req, res);
    }

    #handlePost(oEventData, res) {
      const url = oEventData.url;
      if (!url) {
        res({ status: 400, error: `Bad Request no url provided!` });
        return;
      }
      const url_obj = new URL(`http://${API.own_id}/${url}`);

      const handler = this.#post_expr.find(r => r.regex.test(decodeURIComponent(url_obj.pathname)));
      if (!handler) {
        res({ status: 404, error: `The requested ressource does not exist!` });
        return;
      }
      //reset the regex because of the global 'g' modifier
      this.#post_expr.forEach(r => r.regex.lastIndex = 0);
      const req = {}
      var parts = [decodeURIComponent(url.pathname).matchAll(handler.regex)][0];
      const key = parts[2];
      const navigation = parts[3];

      req.pathParam = {};
      req.pathParam['key'] = key;
      req.pathParam['navigation'] = navigation;

      req.searchParams = {};
      for (var spkey of url_obj.searchParams.keys()) {
        req.searchParams[spkey] = url_obj.searchParams.get(spkey);
      }

      req.url = url;
      req.body = oEventData.body;

      this.#post_routes[handler.id](req, res);
    }

    #retrievePathParameters(sUrl, handler) {
      const paramMap = {};
      handler.paramList.forEach(param => {
        const parRegex = new RegExp('\\' + param.encFront + "([a-zA-Z0-9'-])+" + "\\" + param.encEnd);
        const res = sUrl.match(parRegex);
        if (res) {
          paramMap[param.name] = res[0].replace(param.encFront, '').replace(param.encEnd, '');
        } else {
          paramMap[param.name] = undefined;
        }
        sUrl = sUrl.replace(parRegex, '[done]');
      })
      return paramMap;

      //#endregion private
    }
  }

  //#region setup com
  const communicationService = new API(location.href.origin + '/page');
  const ext_id = document.getElementById('UI5TR-communication-js').getAttribute('data-id');

  communicationService.get('/controls', (req, res) => {
    if (req.searchParams.count === '') {
      const controlType = req.searchParams.control_type;
      const attributes = decodeURIComponent(req.searchParams.attributes);
      const recorderInstance = window.ui5TestRecorder?.recorder;
      if (recorderInstance) {
        let elements = recorderInstance.getElementsByAttributes(controlType, JSON.parse(attributes));
        res({ status: 200, message: elements.length });
      } else {
        res({ status: 500, message: 'No recorder inject found!' });
      }
    }
  });

  communicationService.get("/controls(<id>)", (req, res) => {
    const recorderInstance = window.ui5TestRecorder?.recorder;
    if (recorderInstance) {
      if (req.searchParams.count === '') {
        let elements = [];
        if (req.pathParams.id.indexOf("'") > -1) {
          elements = recorderInstance.getElementsForId(req.pathParams.id.replaceAll("'", ''))
        } else {
          elements = recorderInstance.getElementsForId(req.pathParams.id);
        }
        res({ status: 200, message: elements.length });
      }
    } else {
      res({ status: 500, message: 'No recorder inject found!' });
    }
  });

  communicationService.post('/controls/action', (req, res) => {
    const recorderInstance = window.ui5TestRecorder?.recorder;
    if (recorderInstance) {
      const body = req.body;
      recorderInstance.executeAction({ step: body.step, useSelectors: body.useManualSelection }).then(() => {
        res({ status: 200, message: 'executed' });
      }).catch((e) => {
        res({ status: 500, message: e });
      });
    } else {
      res({ status: 500, message: 'No recorder inject found!' });
    }
  });

  communicationService.post('/pageInfo/disconnected', (_, __) => {
    if (ui5TestRecorder.recorder) {
      ui5TestRecorder.recorder.showToast('UI5 Journey Recorder disconnected', {
        duration: 2000,
        autoClose: true
      })
    }
  });

  communicationService.get('/pageInfo/connected', (_, res) => {
    res({ status: 200, message: 'Connected' });
  });

  communicationService.get('/pageInfo/version', (_, res) => {
    const version = ui5TestRecorder?.recorder?.getUI5Version();
    if (version) {
      res({ status: 200, message: version });
    } else {
      res({ status: 400, message: '' });
    }
  });

  communicationService.post('/disableRecordListener', (_, res) => {
    const recorderInstance = window.ui5TestRecorder?.recorder;
    if (recorderInstance) {
      recorderInstance.disableRecording();
      res({ status: 200, message: 'executed' });
    } else {
      res({ status: 500, message: 'No recorder inject found!' });
    }
  });

  communicationService.post('/enableRecordListener', (_, res) => {
    const recorderInstance = window.ui5TestRecorder?.recorder;
    if (recorderInstance) {
      recorderInstance.enableRecording();
      res({ status: 200, message: 'executed' });
    } else {
      res({ status: 500, message: 'No recorder inject found!' });
    }
  })

  communicationService.listen(ext_id);

  window.ui5TestRecorder = {
    ...window.ui5TestRecorder,
    ... {
      communication: communicationService
    }
  }
  //#endregion setup com
})();
