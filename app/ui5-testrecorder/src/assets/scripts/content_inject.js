(function () {
  "use strict";

  //DOM-node tags
  const TAG_ID_PREFIX = "UI5TR-"
  const EXT_ID = chrome.runtime.id;
  const page_origin = new URL(location.href).origin;
  let port;

  console.log('injected');

  function injectJS() {
    console.log('--- Inject UI5 Testrecorder JS ---');
    let script = document.createElement('script');
    script.id = `${TAG_ID_PREFIX}-js`;
    script.src = chrome.runtime.getURL('/assets/scripts/page_inject.js');
    script.defer = "defer";
    document.head.appendChild(script);
  }

  function commJS() {
    console.log('--- Inject Communication JS ---');
    let script = document.createElement('script');
    script.id = `${TAG_ID_PREFIX}communication-js`;
    script.src = chrome.runtime.getURL('/assets/scripts/communication_inject.js');
    script.setAttribute('data-id', EXT_ID);
    script.defer = "defer";
    document.head.appendChild(script);
  }

  function setup_port_passthrough() {
    port = chrome.runtime.connect({ name: "ui5_tr" });
    port.onMessage.addListener((msg) => {
      window.postMessage({
        origin: EXT_ID,
        ...msg
      })
    });

    const page_id = EXT_ID + '_ui5_tr_handler';
    window.addEventListener("message", (event) => {
      if (event.data.origin === page_id && event.origin === page_origin) {
        port.postMessage({ data: event.data.message })
      }
    })
  }

  injectJS();
  commJS();
  setup_port_passthrough();
}());
