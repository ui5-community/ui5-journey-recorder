let change_color_button = document.getElementById("changeColor");
let alert_button = document.getElementById("alertMessage");
let ui5_inject_button = document.getElementById("injectUI5scripts");
let send_message_button = document.getElementById("sendMessage");
let rest_message_button = document.getElementById("restRequest");

let tab_list = document.getElementById("tab_list");
let tab_id_input = document.getElementById("tab_id");
let message_input = document.getElementById("message");
let info_text = document.getElementById("info");

let tab_map = {};
let internal_port;

// When the button is clicked, inject setPageBackgroundColor into current page
change_color_button.addEventListener("click", async () => {
    let id = tab_id_input.value;

    if (!id || id === '') {
        printMessage('!!No ID provided!!', true);
        return;
    } else {
        printMessage(' ', false);
    }

    requestPermission(tab_map[id]).then(() => {
        chrome.scripting.executeScript({
            target: { tabId: parseInt(id, 10) },
            function: setPageBackgroundColor,
        }, (...args) => {
            console.dir(args);
        });
    }).catch();
});

alert_button.addEventListener("click", async () => {
    let id = tab_id_input.value;

    if (!id || id === '') {
        printMessage('!!No ID provided!!', true);
        return;
    } else {
        printMessage(' ', false);
    }

    requestPermission(tab_map[id]).then(() => {
        chrome.scripting.executeScript({
            target: { tabId: parseInt(id, 10) },
            func: (name) => { alert(`"${name}" executed`) },
            args: ["Hello :..."]
        }, (...args) => {
            console.dir(args);
        });
    }).catch();
});

ui5_inject_button.addEventListener("click", async () => {
    let id = tab_id_input.value;

    if (!id || id === '') {
        printMessage('!!No ID provided!!', true);
        return;
    } else {
        printMessage(' ', false);
    }

    establishConnection(tab_map[id]).then(() => {
        printMessage("connected");
    })
});

send_message_button.addEventListener("click", async () => {
    if (message_input.value !== " " && internal_port) {
        internal_port.postMessage(message_input.value);
    }
});

rest_message_button.addEventListener("click", async () => {
    if (message_input.value !== "") {
        let id = tab_id_input.value;

        if (!id || id === '') {
            printMessage('!!No ID provided!!', true);
            return;
        } else {
            printMessage(' ', false);
        }

        chrome.tabs.sendMessage(tab_map[id].id, { message: message_input.value }, (response) => {
            console.dir(response);
            return true;
        });
    }
});

function loadList() {
    chrome.tabs.query({ currentWindow: false }, function (tabs) {
        /* console.dir(tabs.map(t => t.url)); */
        tabs.forEach(tab => {
            let li = document.createElement('li');
            li.innerHTML = `ID: ${tab.id}, URL: ${tab.url}`;
            tab_list.appendChild(li);
            tab_map['' + tab.id] = { id: tab.id, url: tab.url };
        });
    })
}

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
    chrome.storage.sync.get("color", ({ color }) => {
        document.body.style.backgroundColor = color;
    });
}

function requestPermission({ id, url }) {
    return new Promise((resolve, reject) => {
        chrome.permissions.contains({
            permissions: ['tabs'],
            origins: [url]
        }, (result) => {
            if (result) {
                resolve();
            } else {
                chrome.permissions.request({
                    permissions: ['tabs'],
                    origins: [url]
                }, (granted) => {
                    // The callback argument will be true if the user granted the permissions.
                    if (granted) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            }
        });
    })
}

function colorizeColorButton() {
    chrome.storage.sync.get("color", ({ color }) => {
        change_color_button.style.backgroundColor = color;
    });
}

let connection;
let bInjectAttempted = false;

function establishConnection({ id, url }) {
    return new Promise((resolve, reject) => {
        const inject_after_reload = (iTabId, oChangeInfo, oTab) => {
            if (!bInjectAttempted && id === iTabId && oChangeInfo.status === "complete") {
                bInjectAttempted = true;
            } else {
                return;
            }

            setTimeout(() => {
                chrome.scripting.executeScript({
                    target: { tabId: iTabId },
                    files: ['/scripts/content_inject.js']
                }, (...args) => {
                    chrome.tabs.onUpdated.removeListener(inject_after_reload);
                    resolve();
                });
            }, 2500);
        }

        /* const inject_done = (sChannelId, sEventId, oData) => {
            if (oData.status === "success") {
                resolve(oData);
            } else {
                connection = null;
                bInjectAttempted = false;
                reject(oData);
            }
        } */

        requestPermission({ id: id, url: url }).then(() => {
            chrome.tabs.onUpdated.addListener(inject_after_reload);
            chrome.tabs.reload(id, {
                bypassCache: false
            });
        }).catch(() => {
            reject();
        });
    });
}

function setupListener() {
    chrome.runtime.onConnect.addListener((port) => {
        //ignore if a connection is already active
        if (port && port.name === "ui5_tr") {
            internal_port = port;
            printMessage("Inject connected");
            setTimeout(() => {
                printMessage(" ");
            }, 5000);
            internal_port.onDisconnect.addListener(() => {
                port = null;
            });
            internal_port.onMessage.addListener((oData) => {
                console.log(oData);
            });
        } else {
            return;
        }
    });
}

function printMessage(sMsg, bError) {
    if (bError) {
        info_text.style.color = "red";
        info_text.style.border = "1px solid red";
    } else {
        info_text.style.color = "black";
        info_text.style.border = "1px solid black";

    }
    info_text.innerText = sMsg;
}

colorizeColorButton();
loadList();
setupListener();