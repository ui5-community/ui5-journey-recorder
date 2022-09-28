let color = '#3aa757';

/* chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ color });
    console.log('Default background color set to %cgreen', `color: ${color}`);
}); */

chrome.action.onClicked.addListener((/* tab */) => {/*
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (name) => { alert(`"${name}" executed`); },
        args: ['action']
    }); */

  chrome.windows.create({
    url: chrome.runtime.getURL('../index.html'),
    type: 'popup',
    focused: true
  }, (fnWindow) => {/*
    console.log(`loaded extension with id: ${fnWindow.id}`); */
  });

});
