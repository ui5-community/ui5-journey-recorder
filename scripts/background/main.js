var bInitialized = false;
var bNextImmediateStart = false;

chrome.contextMenus.create({
	title: "Create Element Selector",
	contexts: ["selection", "page", "link", "editable", "image"],
	onclick: function (e) {
		chrome.tabs.getSelected(null, function (tab) {
			createAndStart(tab, true);
		});
	}
});


chrome.browserAction.onClicked.addListener(function (tab) {
	createAndStart(tab, false);
});

function createAndStart(tab, bStartSelectImmediate) {
	var sOurTabId = tab.id;
	var sOurWindowId = 0;
	bNextImmediateStart = bStartSelectImmediate;

	chrome.tabs.onRemoved.addListener(function (tabId, info) {
		if (tabId === sOurTabId) {
			chrome.windows.remove(sOurWindowId);
		}
	}.bind(this));

	chrome.tabs.create({
		url: chrome.extension.getURL('/scripts/popup/index.html'),
		active: false
	}, function (tab) {
		chrome.windows.create({
			tabId: tab.id,
			type: 'popup',
			focused: true
		}, function (fnWindow) {
			sOurWindowId = fnWindow.id;
			if (bInitialized === false) {
				bInitialized = true;
				chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
					if (message.type === "HandshakeToWindow") {
						chrome.runtime.sendMessage({
							"type": "send-window-id",
							"windowid": sender.tab.windowId,
							"startImmediate": bNextImmediateStart
						}, function (response) {
						});
					}
				});
			}
		});
	});
}