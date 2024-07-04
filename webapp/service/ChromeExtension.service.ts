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
    intervalID?: ReturnType<typeof setInterval>;
    retryCount: number;
};

export interface RequestAnswer {
    status: number;
    message: unknown
}

export const RECORD_TOKEN_CHANNEL = 'record-token-channel';
export const NEW_RECORD_TOKEN = 'new-record-token';

//copied from the chrome.scripting index.d.ts for better type help
interface InjectionResult<T = unknown> {
    /**
     * The document associated with the injection.
     * @since Chrome 106.
     */
    documentId: string;
    /**
     * The frame associated with the injection.
     * @since Chrome 90.
     */
    frameId: number;
    /* The result of the script execution. */
    result?: T | undefined;
}

export class ChromeExtensionService {
    private static instance: ChromeExtensionService;
    // for 30 sec timeout we try to reach the "backend"
    // 10 times every 3 seconds
    private static readonly INTERVAL_TIME = 3000;
    private static readonly RETRY_COUNT = 10;

    private _currentTab: Tab | undefined;
    private _internalPort: chrome.runtime.Port | null = null;
    private _injectAttempted: boolean = false;
    private _messageId: number = 0;
    private _intervalId: number = 0;
    private _messageMap: Record<number, Synchronizer> = {};

    private _eventBus: EventBus = EventBus.getInstance();

    private _setupDisconnectListener: () => void;
    private _setupOnMessageListener: (message: { data?: { message_id?: number, status: number, instantType: 'record-token', content?: unknown } }) => void;
    private _setupInstantListener: (msg: { message_id?: number, code: number, instantType: 'record-token', content?: unknown, data: unknown }) => void;


    private constructor() { }

    public static getInstance(): ChromeExtensionService {
        if (!ChromeExtensionService.instance) {
            ChromeExtensionService.instance = new ChromeExtensionService();
        }
        return ChromeExtensionService.instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static getAllTabs(onylUI5: boolean = false): Promise<Tab[]> {
        const _resultingTabs = (tabs: chrome.tabs.Tab[]) => {
            return tabs.map(tab => ({
                title: (tab.title) || '',
                path: (tab.url) || '',
                id: (tab.id) || -1,
                icon: (tab.favIconUrl) || ''
            } as Tab)).filter(tab => tab.path !== '' && tab.id !== -1);
        }

        return new Promise((resolve) => {
            chrome.tabs.query({
                currentWindow: false,
                url: [
                    "http://*/*",
                    "https://*/*"
                ],
                status: "complete"
            }, (tabs: chrome.tabs.Tab[]) => {
                if (onylUI5) {
                    Promise.allSettled(tabs.map((tab: chrome.tabs.Tab) => {
                        return ChromeExtensionService._containsUI5(tab)
                    })).then((results: PromiseSettledResult<boolean>[]) => {
                        results.forEach((res: PromiseSettledResult<boolean>, ind: number) => {
                            // if no ui5 is present we can remove the url to filter out
                            if (!(res).value) {
                                tabs[ind].url = '';
                            }
                        })
                        resolve(_resultingTabs(tabs));
                    }).catch(() => {
                        resolve(_resultingTabs(tabs));
                    })
                } else {
                    resolve(_resultingTabs(tabs));
                }
            });
        });
    }

    private static _containsUI5(tab: chrome.tabs.Tab): Promise<boolean> {
        function checkUI5() {
            let normal = [].slice.call(document.head.getElementsByTagName('script')).filter(function (s) {
                return s.src.indexOf('sap-ui-core.js') > -1;
            }).length == 1;
            let onPremise = [].slice.call(document.head.getElementsByTagName('script')).filter(function (s) {
                return s.src.indexOf('/sap/bc/ui5_ui5/') > -1;
            }).length >= 1;

            if (!normal && !onPremise) {
                //check if we are integrated into an iframe..
                const iFrames = document.getElementsByTagName("iframe");
                for (let i = 0; i < iFrames.length; i++) {
                    if (iFrames[i].contentDocument) {
                        normal = [].slice.call(iFrames[i].contentDocument.head.getElementsByTagName('script')).filter(function (s) {
                            return s.src.indexOf('sap-ui-core.js') > -1 || s.src.indexOf('sap-ui-m-zen.js') > -1;
                        }).length == 1;
                        onPremise = [].slice.call(iFrames[i].contentDocument.head.getElementsByTagName('script')).filter(function (s) {
                            return s.src.indexOf('/sap/bc/ui5_ui5/') > -1;
                        }).length >= 1;

                        if (normal || onPremise) {
                            return true;
                        }
                    }
                }
            }

            return normal || onPremise;
        }

        return new Promise((resolve, reject) => {
            ChromeExtensionService.getInstance()._requestPermission({
                id: tab.id,
                url: tab.url,
            }).then(() => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: checkUI5
                }, (result: InjectionResult<boolean>[]) => {
                    // problem here, we have requested all necessary permissions but the error shows continously up
                    if (chrome.runtime.lastError?.message.indexOf('Cannot access') < 0) {
                        console.error(chrome.runtime.lastError?.message);
                    }
                    if (result) {
                        resolve(result[0].result);
                    } else {
                        reject(false);
                    }
                })
            }).catch((e) => {
                console.log(e);
                resolve(true);
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
                this._setupDisconnectListener = () => {
                    this._onDisconnectListener();
                };
                this._setupOnMessageListener = (message: { data?: { message_id?: number, status: number, instantType: 'record-token', content?: unknown } }) => {
                    this._onMessageListener(message);
                };
                this._setupInstantListener = (msg: { message_id?: number, code: number, instantType: 'record-token', content?: unknown, data: unknown }) => {
                    this._onInstantMessage(msg);
                };
                // ignore if a connection is already active
                if (port && port.name === 'ui5_tr') {
                    this._internalPort = port;
                    this._internalPort.onDisconnect.addListener(this._setupDisconnectListener);
                    this._internalPort.onMessage.addListener(this._setupOnMessageListener);
                    chrome.runtime.onMessage.addListener(this._setupInstantListener);
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
            const syncObject: Synchronizer = { success: resolve, error: reject, retryCount: 0 };

            syncObject.intervalID = setInterval(() => {
                if (syncObject.retryCount >= ChromeExtensionService.RETRY_COUNT) {
                    clearInterval(syncObject.intervalID);
                    reject({ status: 503, message: "Service doesn't respond" });
                }
                syncObject.retryCount++;
                this._sendMessage(msg);
            }, ChromeExtensionService.INTERVAL_TIME);

            this._messageMap[this._messageId] = syncObject;
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
        await this.disableRecording();
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

    public async disableRecording() {
        const rb = new RequestBuilder();
        rb.setMethod(RequestMethod.POST);
        rb.setUrl('/disableRecordListener');
        const result = await this.sendSyncMessage(rb.build()) as { status: number };
        if (result.status !== 200) {
            throw new Error();
        }
    }

    public async enableRecording() {
        const rb = new RequestBuilder();
        rb.setMethod(RequestMethod.POST);
        rb.setUrl('/enableRecordListener');
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
            this._internalPort.onDisconnect.removeListener(this._setupDisconnectListener);
            this._internalPort.onMessage.removeListener(this._setupOnMessageListener);
            chrome.runtime.onMessage.removeListener(this._setupInstantListener);
            this._setupDisconnectListener = null;
            this._setupOnMessageListener = null;
            this._setupInstantListener = null;

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
            const { success, error, intervalID } = this._messageMap[messageId];
            clearInterval(intervalID);
            delete message.data.message_id;
            if (message.data.status >= 200 && message.data.status <= 299) {
                success(message.data);
            } else {
                error(message.data);
            }
        } else {
            if (message?.data?.instantType === 'record-token') {
                console.log('got record token');
                this._eventBus.publish(RECORD_TOKEN_CHANNEL, NEW_RECORD_TOKEN, message?.data?.content as Record<string, unknown>);
            }
        }
    }

    private _sendMessage(oInfo: unknown) {
        this._internalPort?.postMessage(oInfo);
    }

    private _onInstantMessage(msg: { message_id?: number, code: number, instantType: 'record-token', content?: unknown, data: unknown }): void {
        if (msg?.message_id && this._messageMap[msg.message_id]) {
            const synchronizer = this._messageMap[msg.message_id];
            clearInterval(synchronizer.intervalID);
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