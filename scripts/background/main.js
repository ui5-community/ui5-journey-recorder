var bInitialized = false;
var bNextImmediateStart = false;

/**
 * Open /scripts/popup/index.html in new popup-type window.
 */
chrome.browserAction.onClicked.addListener(function (tab) {
	"use strict";

	// create new window in popup type and focus it immediately
	chrome.windows.create({
		url: chrome.extension.getURL('/scripts/popup/index.html'),
		type: 'popup',
		focused: true
	}, function (fnWindow) {

		if (bInitialized === false) {

			// new window is now initialized
			bInitialized = true;

			// send handshake message with window ID and 'bNextImmediateStart'
			chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
				if (message.type === "handshake-get-window-id") {
					sendResponse({
						"type": "handshake-send-window-id",
						"windowId": fnWindow.id,
						"startImmediate": bNextImmediateStart
					});
				}
			});
		}

	});
});
