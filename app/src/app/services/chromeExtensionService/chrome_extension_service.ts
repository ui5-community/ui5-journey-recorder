import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AppFooterService } from 'src/app/components/app-footer/app-footer.service';
import { SnackSeverity } from 'src/app/components/dialogs/snack-dialog/snack-dialog.component';
import { Request } from '../../classes/requestBuilder';
import { MessageService } from '../messageService/message.service';

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
  private _interval_id: number = 0;

  private currentPage: Page | undefined;

  private _message_id: number = 0;
  private _message_map: { [key: number]: Synchronizer } = {};

  constructor(
    private messageService: MessageService,
    private appFooterService: AppFooterService
  ) {}

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

  public setCurrentPage(page?: Page) {
    this.currentPage = page;
  }

  public getTabInfoForCurrentConnection(): Promise<chrome.tabs.Tab> {
    if (!this.currentPage) {
      return Promise.reject();
    } else {
      return this._getTabInfoById(this.currentPage.id);
    }
  }

  public connectToCurrentPage(withReload: boolean = false): Promise<void> {
    if (this.internal_port !== null) {
      return Promise.reject();
    }
    this.appFooterService.connecting();
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

              this.messageService.show({
                severity: SnackSeverity.SUCCESS,
                title: 'Injection',
                detail: 'Connection established!',
              });
              this.appFooterService.connected();
              this._interval_id = setInterval(
                this._checkConnection.bind(this),
                450
              );
              resolve();
            }
          );
        }, 2500);
      };

      const setupPort = (port: chrome.runtime.Port) => {
        //ignore if a connection is already active
        if (port && port.name === 'ui5_tr') {
          this.internal_port = port;
          this.internal_port.onDisconnect.addListener(
            this._onDisconnectListener.bind(this)
          );
          this.internal_port.onMessage.addListener(
            this._onMessageListener.bind(this)
          );
          chrome.runtime.onMessage.addListener(
            this._onInstantMessage.bind(this)
          );
          chrome.runtime.onConnect.removeListener(setupPort);
          resolve();
        } else {
          return;
        }
      };

      chrome.runtime.onConnect.addListener(setupPort);

      if (this.currentPage) {
        this._requestPermission({
          id: this.currentPage.id,
          url: this.currentPage.path,
        })
          .then(() => {
            if (withReload) {
              chrome.tabs.onUpdated.addListener(inject_after_reload);
              if (this.currentPage) {
                chrome.tabs.reload(this.currentPage.id, {
                  bypassCache: false,
                });
              } else {
                reject();
              }
            } else {
              if (this.currentPage) {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: this.currentPage.id },
                    files: ['/assets/scripts/content_inject.js'],
                  },
                  () => {
                    this.messageService.show({
                      severity: SnackSeverity.SUCCESS,
                      title: 'Injection',
                      detail: 'Connection established!',
                    });
                    this.appFooterService.connected();
                    this._interval_id = setInterval(
                      this._checkConnection.bind(this),
                      450
                    );
                    resolve();
                  }
                );
              } else {
                reject();
              }
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

  public isConnectedToPage(): boolean {
    if (!this.currentPage) {
      return false;
    }
    if (this.internal_port === null) {
      return false;
    }
    return true;
  }

  private async _checkConnection(): Promise<void> {
    try {
      if (this.internal_port === null) {
        return;
      }
      if (!this.currentPage?.id) {
        return;
      }
      await chrome.tabs.get(this.currentPage.id);
    } catch (error) {
      this._resetConnection();
    }
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
      this._resetConnection();
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

  public sendSyncMessage(msg: Request): Promise<any> {
    msg.message_id = ++this._message_id;
    return new Promise((resolve, reject) => {
      const syncObject: Synchronizer = { success: resolve, error: reject };
      this._message_map[this._message_id] = syncObject;
      this._sendMessage(msg);
    });
  }

  private _getTabInfoById(page_id: number): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, _) => {
      chrome.tabs.get(parseInt('' + page_id, 10), (tab: chrome.tabs.Tab) => {
        resolve(tab);
      });
    });
  }

  private _onDisconnectListener(): void {
    this._resetConnection();
    this.messageService.show({
      severity: SnackSeverity.ERROR,
      title: 'Connection',
      detail: 'Connection to page lost!',
    });
  }

  private _resetConnection(): void {
    if (this.internal_port !== null) {
      this.internal_port.onDisconnect.removeListener(
        this._onDisconnectListener.bind(this)
      );
      this.internal_port.onMessage.removeListener(
        this._onMessageListener.bind(this)
      );
      chrome.runtime.onMessage.removeListener(
        this._onInstantMessage.bind(this)
      );
      this.internal_port.disconnect();
      this.internal_port = null;
      this.bInjectAttempted = false;
      clearInterval(this._interval_id);
      this._interval_id = 0;
      this.appFooterService.disconnected();
    }
  }

  private _onMessageListener(message: any, port: chrome.runtime.Port) {
    if (
      message &&
      message.data &&
      message.data.message_id &&
      this._message_map[message.data.message_id]
    ) {
      const { success, error } = this._message_map[message.data.message_id];
      delete message.data.message_id;
      if (message.data.status >= 200 && message.data.status <= 299) {
        success(message.data);
      } else {
        error(message.data);
      }
    } else {
      switch (message?.data?.instantType) {
        case 'record-token':
          this._recordingSource.next(message?.data?.content);
          break;
      }
    }
  }

  private _requestPermission(oPermissionInfo: {
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

  private _sendMessage(oInfo: any) {
    this.internal_port?.postMessage(oInfo);
  }

  private _onInstantMessage(msg: any): void {
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
