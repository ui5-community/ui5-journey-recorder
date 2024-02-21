(function () {
  "use strict";

  //DOM-node tags
  const TAG_ID_PREFIX = "UI5TR-"
  const EXT_ID = chrome.runtime.id;
  const page_origin = new URL(location.href).origin;
  let port;

  console.log('injected');

  function injectJS() {
    console.log('--- Inject UI5 Journey Recorder JS ---');
    let script = document.createElement('script');
    script.id = `${TAG_ID_PREFIX}-js`;
    script.src = chrome.runtime.getURL('/assets/scripts/page_inject.js');
    script.defer = "defer";
    document.head.prepend(script);
  }

  function commJS() {
    console.log('--- Inject Communication JS ---');
    let script = document.createElement('script');
    script.id = `${TAG_ID_PREFIX}communication-js`;
    script.src = chrome.runtime.getURL('/assets/scripts/communication_inject.js');
    script.setAttribute('data-id', EXT_ID);
    script.defer = "defer";
    document.head.prepend(script);
  }

  function setupInjectCSS() {
    let css = '.injectClass { box-shadow: 0 0 2px 2px red, inset 0 0 2px 2px red; }';
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');

    style.id = "UI5TR--css";
    style.appendChild(document.createTextNode(css));

    head.prepend(style);
  }

  function setup_port_passthrough() {
    port = chrome.runtime.connect({ name: "ui5_tr" });

    port.onMessage.addListener((msg) => {
      window.postMessage({
        origin: EXT_ID,
        ...msg
      })
    });

    port.onDisconnect.addListener(() => {

      window.postMessage({
        origin: EXT_ID,
        ...{
          url: '/pageInfo/disconnected',
          method: 'POST',
          message_id: -1
        }
      });
      document.getElementById(`${TAG_ID_PREFIX}communication-js`).remove();
      document.getElementById(`${TAG_ID_PREFIX}-js`).remove();
      document.getElementById(`${TAG_ID_PREFIX}-css`).remove();
    });

    const page_id = EXT_ID + '_ui5_tr_handler';
    window.addEventListener("message", (event) => {

      if (event.data.origin === page_id && event.origin === page_origin) {
        port.postMessage({ data: event.data.message || event.data.response });
      }
    })

    window.addEventListener("beforeunload", () => {
      port.disconnect();
    })
  }

  injectJS();
  commJS();
  setupInjectCSS();
  setup_port_passthrough();
}());
