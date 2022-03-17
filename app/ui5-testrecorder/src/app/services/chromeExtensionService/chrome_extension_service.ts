import { Injectable } from "@angular/core";
import { MessageService } from "primeng/api";
import { Observable, Subject } from "rxjs";

export interface Page {
  title: string;
  path: string;
  id: number;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChromeExtensionService {
  private _recordingSource = new Subject<any>();

  private internal_port: chrome.runtime.Port | null = null;
  private bInjectAttempted: boolean = false;

  constructor(private messageService: MessageService) { }

  public get_all_tabs(only_ui5: boolean = false): Promise<Page[]> {
    return new Promise((resolve, _) => {
      chrome.tabs.query({ currentWindow: false }, (tabs: chrome.tabs.Tab[]) => {
        resolve(tabs.map((t, i) => {
          return { title: t.title || "", path: t.url || "", id: t.id || i, icon: t.favIconUrl || "" };
        }).filter((t) => {
          return t.path !== ""
        }));
      });
    });
  }

  public getTabInfoById(page_id: number): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, _) => {
      chrome.tabs.get(parseInt("" + page_id, 10), (tab: chrome.tabs.Tab) => {
        resolve(tab);
      })
    });
  }

  public inject_scripts(page: Page): Promise<void> {
    return new Promise((resolve, reject) => {
      const inject_after_reload = (iTabId: number, oChangeInfo: chrome.tabs.TabChangeInfo, _: chrome.tabs.Tab) => {
        if (!this.bInjectAttempted && page.id === iTabId && oChangeInfo.status === "complete") {
          this.bInjectAttempted = true;
        } else {
          return;
        }

        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: iTabId },
            files: ['/assets/scripts/content_inject.js']
          }, () => {
            chrome.tabs.onUpdated.removeListener(inject_after_reload);
            resolve();
          });
        }, 2500);
      }

      chrome.runtime.onConnect.addListener((port) => {
        //ignore if a connection is already active
        if (port && port.name === "ui5_tr") {
          this.internal_port = port;
          this.internal_port.onDisconnect.addListener(this.onDisconnectListener.bind(this));
          this.internal_port.onMessage.addListener(this.onMessageListener.bind(this));
          resolve();
        } else {
          return;
        }
      });

      this.requestPermission({ id: page.id, url: page.path }).then(() => {
        chrome.tabs.onUpdated.addListener(inject_after_reload);
        chrome.tabs.reload(page.id, {
          bypassCache: false
        });
      }).catch(() => {
        reject();
      });
    });
  }

  public focus_page(page: Page): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(page.id, { active: true }, (tab) => {
        if (tab) {
          chrome.windows.update(tab.windowId, { focused: true }).then(
            () => {
              resolve();
            }
          )
        } else {
          reject();
        }
      });
    });
  }

  public register_recording_websocket(): Observable<any> {
    return this._recordingSource.asObservable();
  }

  private onDisconnectListener(): void {
    this.internal_port = null;
    this.messageService.add({ severity: 'error', summary: 'Connection', detail: 'Connection to page lost!' });
  }

  private onMessageListener(message: any, port: chrome.runtime.Port) {
    switch (message?.data?.instantType) {
      case 'record-token':
        this._recordingSource.next(message?.data?.content);
        break;
    }
    console.log(message);
  }

  private requestPermission(oPermissionInfo: { id?: number, url: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.permissions.contains({
        permissions: ['tabs'],
        origins: [oPermissionInfo.url]
      }, (result) => {
        if (result) {
          resolve();
        } else {
          chrome.permissions.request({
            permissions: ['tabs'],
            origins: [oPermissionInfo.url]
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
}
