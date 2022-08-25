/* window.addEventListener("message", (event) => {
    console.dir(event);
    let ext_id = document.getElementById('UI5TR-communication-js').getAttribute('data-id');
    //document.getElementById('UI5TR-communication-js').src.replace('chrome-extension://', '').replace('/scripts/communication_inject.js', '')
    if (event.origin === page_origin && event.data.origin === ext_id) {
        const id = event.data.message_id;
        window.postMessage({ id: id, origin: ext_id + '_' + own_id, status: 200, data: { message: "backward" } });
    }
}); */

/* class Example {
}
Object.defineProperty(Example, 'constant1', {
    value: 33,
    writable : false,
    enumerable : true,
    configurable : false
});
Example.constant1; // 33
Example.constant1 = 15; // TypeError */ //define constants on a class;
class WS {
  static own_id = "ui5_tr_handler";
  constructor(sExt_id) {
    this.ext_id = sExt_id;
  }

  send_record_step(step) {
    window.postMessage({
      origin: `${this.ext_id}_${WS.own_id}`, message: {
        instantType: 'record-token',
        content: step
      }
    });
  }
}

class API {
  static own_id = "ui5_tr_handler";
  static key_ident = `(\\(\\S+\\))?`;
  static nav_prop = `(\\/\\S+)?`;

  _root = "";
  _getter_expr = [];
  _post_expr = [];
  _getter_routes = [];
  _post_routes = [];

  /**
   * Constructor of the API
   *
   * @param {string} [sRoot] optional root path, used as prefix bevor every route
   */
  contructor(sRoot) {
    this._root = sRoot || "";
  }

  /**
   * Set a getter route for the api
   *
   * @param {string} sRoute which should be handled
   * @param {function(req,res)=>void} callback function handling calls to the route
   */
  get(sRoute, callback) {
    const prefix = this._root + sRoute;
    const regexp = new RegExp(`(${prefix})${API.key_ident}${API.nav_prop}`, 'gm');
    const map_id = this._getter_expr.length;
    this._getter_expr.push({ regex: regexp, id: map_id });
    this._getter_routes[map_id] = callback;
  }

  /**
   * Set a post route for the api
   *
   * @param {string} sRoute
   * @param {function(req,res)=>void} callback function handling calls to the route
   */
  post(sRoute, callback) {
    const prefix = this._root + sRoute;
    const regexp = new RegExp(`(${prefix})${API.key_ident}${API.nav_prop}`, 'gm');
    const map_id = this._post_expr.length;
    this._post_expr.push({ regex: regexp, id: map_id });
    this._post_routes[map_id] = callback;
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
        this._handleEvent(oEvent, sListenerId);
      }
    });
  }

  _provideResponseCallback(event_id, answer_origin) {
    return (oResponseData) => {
      window.postMessage({ origin: answer_origin, response: { message_id: event_id, ...oResponseData } });
    };
  }

  _handleEvent(oEvent, sExt_id) {
    const answer_origin = `${sExt_id}_${API.own_id}`;
    const event_id = oEvent?.data?.message_id;
    const req_type = oEvent?.data?.method;

    switch (req_type) {
      case 'GET':
        this._handleGet(oEvent?.data, this._provideResponseCallback(event_id, answer_origin));
        break;
      case 'POST':
        this._handlePost(oEvent?.data, this._provideResponseCallback(event_id, answer_origin))
        break;
      default:
        this._provideResponseCallback(event_id, answer_origin)({ status: 501, error: `Request type (${req_type}) not provided` });
    }
  }

  _handleGet(oEventData, res) {
    const url = oEventData.url;
    if (!url) {
      res({ status: 400, error: `Bad Request no url provided!` });
      return;
    }
    const url_obj = new URL(`http://${API.own_id}/${url}`);

    const handler = this._getter_expr.find(r => r.regex.test(decodeURIComponent(url_obj.pathname)));
    if (!handler) {
      res({ status: 404, error: `The requested ressource does not exist!` });
      return;
    }
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

    this._getter_routes[handler.id](req, res);
  }

  _handlePost(oEventData, res) {
    const url = oEventData.url;
    if (!url) {
      res({ status: 400, error: `Bad Request no url provided!` });
      return;
    }
    const url_obj = new URL(`http://${API.own_id}/${url}`);

    const handler = this._post_expr.find(r => r.regex.test(decodeURIComponent(url_obj.pathname)));
    if (!handler) {
      res({ status: 404, error: `The requested ressource does not exist!` });
      return;
    }
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

    this._post_routes[handler.id](req, res);
  }
}

const com_api = new API(location.href.origin + '/page');

com_api.get('/controls', (req, res) => {
  res({ status: 200, message: "JAY!" });
});

com_api.get('/controls/(:id)', (req, res) => {
  res({ status: 200, message: 'Hello World!' });
});

com_api.post('/controls/action', (req, res) => {
  executeAction({ step: req.body });
});

const ext_id = document.getElementById('UI5TR-communication-js').getAttribute('data-id');

com_api.listen(ext_id);

const ws_api = new WS(ext_id);

//API to design
//https://dmitripavlutin.com/parse-url-javascript/


/* possible endpoint parts selection

/\/page\/control(\(\S+\))?(\/\S+)?/gm

var part = 'control';
var prefix = `(/page/${part})`;
var key_ident = `(\\(\\S+\\))?`;
var nav_prop = `(\\/\\S+)?`;
var regex = new RegExp(`${prefix}${key_ident}${nav_prop}`, 'gm');

var str = decodeURIComponent(url.pathname);
var parts = [...str.matchAll(regex)][0];
*/
