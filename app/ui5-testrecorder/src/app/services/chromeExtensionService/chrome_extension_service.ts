import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { Step } from '../classes/testScenario';

export interface Page {
  title: string;
  path: string;
  id: number;
  icon: string;
}

export type Synchronizer = {
  success: (value: any) => void;
  error: (error: any) => void;
};

@Injectable({
  providedIn: 'root',
})
export class ChromeExtensionService {
  private _recordingSource = new Subject<any>();

  private internal_port: chrome.runtime.Port | null = null;
  private bInjectAttempted: boolean = false;

  private currentPage: Page | undefined;

  private _message_id: number = 0;
  private _message_map: { [key: number]: Synchronizer } = {};

  constructor(private messageService: MessageService) {}

  public static get_all_tabs(only_ui5: boolean = false): Promise<Page[]> {
    return new Promise((resolve, _) => {
      chrome.tabs.query({ currentWindow: false }, (tabs: chrome.tabs.Tab[]) => {
        resolve(
          tabs
            .map((t, i) => {
              return {
                title: t.title || '',
                path: t.url || '',
                id: t.id || i,
                icon: t.favIconUrl || '',
              };
            })
            .filter((t) => {
              return t.path !== '';
            })
        );
      });
    });
  }

  public setCurrentPage(page: Page) {
    this.currentPage = page;
  }

  public getTabInfoForCurrentConnection(): Promise<chrome.tabs.Tab> {
    if (!this.currentPage) {
      return Promise.reject();
    } else {
      return this.getTabInfoById(this.currentPage.id);
    }
  }

  public connectToCurrentPage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const inject_after_reload = (
        iTabId: number,
        oChangeInfo: chrome.tabs.TabChangeInfo,
        _: chrome.tabs.Tab
      ) => {
        if (
          !this.bInjectAttempted &&
          this.currentPage?.id === iTabId &&
          oChangeInfo.status === 'complete'
        ) {
          this.bInjectAttempted = true;
        } else {
          return;
        }

        setTimeout(() => {
          chrome.scripting.executeScript(
            {
              target: { tabId: iTabId },
              files: ['/assets/scripts/content_inject.js'],
            },
            () => {
              chrome.tabs.onUpdated.removeListener(inject_after_reload);
              resolve();
            }
          );
        }, 2500);
      };

      chrome.runtime.onConnect.addListener((port) => {
        //ignore if a connection is already active
        if (port && port.name === 'ui5_tr') {
          this.internal_port = port;
          this.internal_port.onDisconnect.addListener(
            this.onDisconnectListener.bind(this)
          );
          this.internal_port.onMessage.addListener(
            this.onMessageListener.bind(this)
          );
          chrome.runtime.onMessage.addListener(
            this.onInstantMessage.bind(this)
          );
          resolve();
        } else {
          return;
        }
      });
      if (this.currentPage) {
        this.requestPermission({
          id: this.currentPage.id,
          url: this.currentPage.path,
        })
          .then(() => {
            chrome.tabs.onUpdated.addListener(inject_after_reload);
            if (this.currentPage) {
              chrome.tabs.reload(this.currentPage.id, {
                bypassCache: false,
              });
            } else {
              reject();
            }
          })
          .catch(() => {
            reject();
          });
      } else {
        reject();
      }
    });
  }

  public focus_page(page: Page): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(page.id, { active: true }, (tab) => {
        if (tab) {
          chrome.windows.update(tab.windowId, { focused: true }).then(() => {
            resolve();
          });
        } else {
          reject();
        }
      });
    });
  }

  public register_recording_websocket(): Observable<any> {
    return this._recordingSource.asObservable();
  }

  public disconnect(): Promise<void> {
    if (this.internal_port && this.currentPage) {
      this.internal_port.disconnect();
      return chrome.tabs.reload(this.currentPage.id, {
        bypassCache: false,
      });
    } else {
      return Promise.reject();
    }
  }

  public createTabByUrl(url: string): Promise<chrome.tabs.Tab> {
    return chrome.tabs.create({ url: url, active: true });
  }

  public performAction(action: Step): Promise<any> {
    return this.perform_post({ url: '/controls/action', body: action });
  }

  private perform_post(msg: { url: string, body: any }): Promise<any> {
    return this.syncMessage({method: 'POST', ...msg});
  }

  private syncMessage(msg: any): Promise<any> {
    msg.message_id = ++this._message_id;
    return new Promise((resolve, reject) => {
      const syncObject: Synchronizer = { success: resolve, error: reject };
      this._message_map[msg.message_id] = syncObject;
      this.sendMessage(msg);
    });
  }

  private getTabInfoById(page_id: number): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, _) => {
      chrome.tabs.get(parseInt('' + page_id, 10), (tab: chrome.tabs.Tab) => {
        resolve(tab);
      });
    });
  }

  private onDisconnectListener(): void {
    this.internal_port = null;
    this.messageService.add({
      severity: 'error',
      summary: 'Connection',
      detail: 'Connection to page lost!',
    });
  }

  private onMessageListener(message: any, port: chrome.runtime.Port) {
    if (
      message &&
      message.message_id &&
      this._message_map[message.message_id]
    ) {
      if (message.code >= 200 && message.code <= 299) {
        this._message_map[message.message_id].success(message.data);
      } else {
        this._message_map[message.message_id].error(message.data);
      }
    } else {
      switch (message?.data?.instantType) {
        case 'record-token':
          this._recordingSource.next(message?.data?.content);
          break;
      }
    }
  }

  private requestPermission(oPermissionInfo: {
    id?: number;
    url: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.permissions.contains(
        {
          permissions: ['tabs'],
          origins: [oPermissionInfo.url],
        },
        (result) => {
          if (result) {
            resolve();
          } else {
            chrome.permissions.request(
              {
                permissions: ['tabs'],
                origins: [oPermissionInfo.url],
              },
              (granted) => {
                // The callback argument will be true if the user granted the permissions.
                if (granted) {
                  resolve();
                } else {
                  reject();
                }
              }
            );
          }
        }
      );
    });
  }

  private sendMessage(oInfo: any) {
    this.internal_port?.postMessage(oInfo);
  }

  private onInstantMessage(msg: any): void {
    if (msg && msg.message_id && this._message_map[msg.message_id]) {
      if (msg.code >= 200 && msg.code <= 299) {
        this._message_map[msg.message_id].success(msg.data);
      } else {
        this._message_map[msg.message_id].error(msg.data);
      }
    } else {
      console.log(msg);
    }
  }
}
