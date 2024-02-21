import MessageToast from "sap/m/MessageToast";
import { RequestBuilder, RequestMethod, Request } from "../model/class/RequestBuilder.class";
import EventBus from "sap/ui/core/EventBus";
import BaseController from "../controller/BaseController";
import { Step } from "../model/class/Step.class";

export interface Tab {
    title: string;
    path: string;
    id: number;
    icon: string;
}

export type Synchronizer = {
    success: (value: unknown) => void;
    error: (error: unknown) => void;
};

export interface RequestAnswer {
    status: number;
    message: unknown
}

export const RECORD_TOKEN_CHANNEL = 'record-token-channel';
export const NEW_RECORD_TOKEN = 'new-record-token';

export class ChromeExtensionService {
    private static instance: ChromeExtensionService;

    private _currentTab: Tab | undefined;
    private _internalPort: chrome.runtime.Port | null = null;
    private _injectAttempted: boolean = false;
    private _messageId: number = 0;
    private _intervalId: number = 0;
    private _messageMap: Record<number, Synchronizer> = {};

    private _eventBus: EventBus = EventBus.getInstance();

    private constructor() { }

    public static getInstance(): ChromeExtensionService {
        if (!ChromeExtensionService.instance) {
            ChromeExtensionService.instance = new ChromeExtensionService();
        }
        return ChromeExtensionService.instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static getAllTabs(onylUI5: boolean = false): Promise<Tab[]> {
        return new Promise((resolve) => {
            chrome.tabs.query({ currentWindow: false }, (tabs: chrome.tabs.Tab[]) => {
                resolve(tabs.map((tab, index) => {
                    return {
                        title: (tab.title) || '',
                        path: (tab.url) || '',
                        id: (tab.id) || index,
                        icon: (tab.favIconUrl) || ''
                    }
                }).filter((tab) => tab.path !== ''));
            });
        });
    }

    public static getTabInfoById(tabId: number): Promise<Tab> {
        return new Promise((resolve, _) => {
            chrome.tabs.get(parseInt('' + tabId, 10), (tab: chrome.tabs.Tab) => {
                resolve({
                    title: (tab.title) || '',
                    path: (tab.url) || '',
                    id: ((tab.id) || tabId),
                    icon: (tab.favIconUrl) || ''
                });
            });
        });
    }

    public setCurrentTab(tab?: Tab) {
        this._currentTab = tab;
    }

    public connectToCurrentTab(withReload: boolean = false): Promise<void> {
        if (this._internalPort !== null) {
            return Promise.reject();
        }
        return new Promise((resolve, reject) => {
            const inject_after_reload = (
                iTabId: number,
                oChangeInfo: chrome.tabs.TabChangeInfo
            ) => {
                if (
                    !this._injectAttempted &&
                    this._currentTab?.id === iTabId &&
                    oChangeInfo.status === 'complete'
                ) {
                    this._injectAttempted = true;
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
                            const conRequest = new RequestBuilder();
                            conRequest.setMethod(RequestMethod.GET);
                            conRequest.setUrl('pageInfo/connected');
                            void this.sendSyncMessage(conRequest.build()).then((answer) => {
                                if ((answer as RequestAnswer).status === 200) {
                                    this._intervalId = setInterval(
                                        this._checkConnection.bind(this),
                                        450
                                    ) as unknown as number;
                                    resolve();
                                } else {
                                    reject();
                                }
                            });
                        }
                    );
                }, 2500);
            };

            const setupPort = (port: chrome.runtime.Port) => {
                // ignore if a connection is already active
                if (port && port.name === 'ui5_tr') {
                    this._internalPort = port;
                    this._internalPort.onDisconnect.addListener(
                        this._onDisconnectListener.bind(this)
                    );
                    this._internalPort.onMessage.addListener(
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

            if (this._currentTab) {
                this._requestPermission({
                    id: this._currentTab.id,
                    url: this._currentTab.path,
                })
                    .then(() => {
                        if (withReload) {
                            chrome.tabs.onUpdated.addListener(inject_after_reload);
                            if (this._currentTab) {
                                void chrome.tabs.reload(this._currentTab.id, {
                                    bypassCache: false,
                                });
                            } else {
                                reject();
                            }
                        } else {
                            if (this._currentTab) {
                                chrome.scripting.executeScript(
                                    {
                                        target: { tabId: this._currentTab.id },
                                        files: ['/assets/scripts/content_inject.js'],
                                    },
                                    () => {
                                        MessageToast.show('Connection established!');
                                        this._intervalId = setInterval(
                                            this._checkConnection.bind(this),
                                            450
                                        ) as unknown as number;
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

    public sendSyncMessage(msg: Request): Promise<unknown> {
        msg.message_id = ++this._messageId;
        return new Promise((resolve, reject) => {
            const syncObject: Synchronizer = { success: resolve, error: reject };
            this._messageMap[this._messageId] = syncObject;
            this._sendMessage(msg);
        });
    }

    public registerRecordingWebsocket(listenerFunction: (channel: string, event: string, data: object) => void, listener: BaseController) {
        this._eventBus.subscribe(RECORD_TOKEN_CHANNEL, NEW_RECORD_TOKEN, listenerFunction, listener);
    }

    public unregisterRecordingWebsocket(listenerFunction: (channel: string, event: string, data: object) => void, listener: BaseController) {
        this._eventBus.unsubscribe(RECORD_TOKEN_CHANNEL, NEW_RECORD_TOKEN, listenerFunction, listener);
    }

    public focusTab(tab: Tab): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.tabs.update(tab.id, { active: true }, (tab) => {
                if (tab) {
                    chrome.windows.update(tab.windowId, { focused: true }).then(() => {
                        resolve();
                    }).catch(() => {
                        reject();
                    })
                } else {
                    reject();
                }
            });
        });
    }

    public async reconnectToPage(url: string): Promise<void> {
        const tabs = await ChromeExtensionService.getAllTabs();
        let fittingTab = tabs.filter((t: Tab) => t.path === url);

        if (!fittingTab[0]) {
            const chromeTab = await this._createTabByUrl(url);
            await this._waitTabToLoad(chromeTab.id);
            const tab = await ChromeExtensionService.getTabInfoById(chromeTab.id);
            fittingTab = [tab];
        }

        this.setCurrentTab(fittingTab[0]);
        await this.connectToCurrentTab(true);
        await this.focusTab(fittingTab[0]);
    }

    public async disconnect(): Promise<void> {
        if (this._internalPort && this._currentTab) {
            await chrome.tabs.reload(this._currentTab.id, {
                bypassCache: false,
            });
            this._resetConnection();
        }
    }

    public async performAction(step: Step, useRRSelector: boolean = true) {
        const rb = new RequestBuilder();
        rb.setMethod(RequestMethod.POST);
        rb.setUrl('/controls/action');
        rb.setBody({
            step: step.getObject(),
            useManualSelection: !useRRSelector,
        });
        const result = await this.sendSyncMessage(rb.build()) as { status: number };
        if (result.status !== 200) {
            throw new Error();
        }
    }

    private _waitTabToLoad(iTabNumber: number): Promise<void> {
        const targetTabId: number = iTabNumber;
        return new Promise((resolve) => {
            const finishedLoad = (
                iTabId: number,
                oChangeInfo: chrome.tabs.TabChangeInfo
            ) => {
                if (
                    targetTabId === iTabId &&
                    oChangeInfo.status === 'complete'
                ) {
                    resolve();
                } else {
                    return;
                }

                chrome.tabs.onUpdated.removeListener(finishedLoad);
            }
            chrome.tabs.onUpdated.addListener(finishedLoad);
        });
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

    private async _checkConnection(): Promise<void> {
        try {
            if (this._internalPort === null) {
                return;
            }
            if (!this._currentTab?.id) {
                return;
            }
            await chrome.tabs.get(this._currentTab.id);
        } catch (error) {
            this._resetConnection();
        }
    }

    private _resetConnection(): void {
        if (this._internalPort !== null) {
            this._internalPort.onDisconnect.removeListener(
                this._onDisconnectListener.bind(this)
            );
            this._internalPort.onMessage.removeListener(
                this._onMessageListener.bind(this)
            );
            chrome.runtime.onMessage.removeListener(
                this._onInstantMessage.bind(this)
            );
            this._internalPort.disconnect();
            this._internalPort = null;
            this._injectAttempted = false;
            clearInterval(this._intervalId);
            this._intervalId = 0;
        }
    }

    private _onDisconnectListener(): void {
        this._resetConnection();
        MessageToast.show('Connection to tab lost')
    }

    private _onMessageListener(message: { data?: { message_id?: number, status: number, instantType: 'record-token', content?: unknown } }) {
        const messageId = message?.data?.message_id;

        if (
            messageId &&
            this._messageMap[messageId]
        ) {
            const { success, error } = this._messageMap[messageId];
            delete message.data.message_id;
            if (message.data.status >= 200 && message.data.status <= 299) {
                success(message.data);
            } else {
                error(message.data);
            }
        } else {
            if (message?.data?.instantType === 'record-token') {
                this._eventBus.publish(RECORD_TOKEN_CHANNEL, NEW_RECORD_TOKEN, message?.data?.content as Record<string, unknown>);
            }
        }
    }

    private _sendMessage(oInfo: unknown) {
        this._internalPort?.postMessage(oInfo);
    }

    private _onInstantMessage(msg: { message_id?: number, code: number, instantType: 'record-token', content?: unknown, data: unknown }): void {

        if (msg?.message_id && this._messageMap[msg.message_id]) {
            if (msg.code >= 200 && msg.code <= 299) {
                this._messageMap[msg.message_id].success(msg.data);
            } else {
                this._messageMap[msg.message_id].error(msg.data);
            }
        } else {
            console.log(msg);
        }
    }

    private _createTabByUrl(url: string): Promise<chrome.tabs.Tab> {
        return chrome.tabs.create({ url: url, active: true });
    }
}