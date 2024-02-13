export interface Page {
    title: string;
    path: string;
    id: number;
    icon: string;
}

export type Synchronizer = {
    success: (value: unknown) => void;
    error: (error: unknown) => void;
};


export class ChromeExtensionService {
    private static instance: ChromeExtensionService;

    private constructor() { }

    public static getInstance(): ChromeExtensionService {
        if (!ChromeExtensionService.instance) {
            ChromeExtensionService.instance = new ChromeExtensionService();
        }
        return ChromeExtensionService.instance;
    }

    public static getAllTabs(onylUI5: boolean = false): Promise<Page[]> {
        return new Promise((resolve, _) => {
            chrome.tabs.query({ currentWindow: false }, (tabs: chrome.tabs.Tab[]) => {
                resolve(tabs.map((tab, index) => {
                    return {
                        title: (tab.title as string) || '',
                        path: (tab.url as string) || '',
                        id: (tab.id as number) || index,
                        icon: (tab.favIconUrl as string) || ''
                    }
                }).filter((tab) => tab.path !== ''));
            });
        });
    }
}