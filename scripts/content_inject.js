(function () {
    "use strict";

    //DOM-node tags
    const TAG_ID_PREFIX = "UI5TR-"
    const EXT_ID = chrome.runtime.id;

    console.log('injected');

    function injectJS() {
        console.log('--- Inject UI5 Testrecorder JS ---');
        let script = document.createElement('script');
        script.id = `${TAG_ID_PREFIX}-js`;
        script.src = chrome.runtime.getURL('/scripts/page_inject.js');
        script.defer = "defer";
        document.head.appendChild(script);
    }

    function commJS() {
        console.log('--- Inject Communication JS ---');
        let script = document.createElement('script');
        script.id = `${TAG_ID_PREFIX}communication-js`;
        script.src = chrome.runtime.getURL('/scripts/communication_inject.js');
        script.setAttribute('data-id', EXT_ID);
        script.defer = "defer";
        document.head.appendChild(script);
    }

    function setup_ws_end() {
        let port = chrome.runtime.connect({ name: "ui5_tr" });
        port.onMessage.addListener((msg) => {
            console.log(msg);
        });
    }

    var callback_map = {};
    const page_origin = new URL(location.href).origin;

    function setup_backend_proxy() {
        chrome.runtime.onMessage.addListener((req, origin, res) => {
            const time = new Date().getTime();
            console.log(`Content-Endpoint -> origin: ${origin}, req: ${req}`);
            const request_id = origin.id + '_' + time;
            window.postMessage({
                message_id: request_id,
                origin: EXT_ID, //"ui5_tr_content",
                url: req.message
            }, [(response) => { res(response) }]);
            callback_map[request_id] = (response) => { res(response) }
            return true;
        });

        const page_id = EXT_ID + '_ui5_com_handler';

        window.addEventListener("message", (event) => {
            if (event.data.origin === page_id && event.origin === page_origin) {
                const id = event.data.message_id;
                const callback = callback_map[id];
                if (callback) {
                    callback(event.data.response);
                }
            }
        });
    }

    injectJS();
    commJS();
    setup_ws_end();
    setup_backend_proxy();
}());
