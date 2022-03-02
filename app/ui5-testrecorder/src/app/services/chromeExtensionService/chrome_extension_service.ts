import { Injectable } from "@angular/core";

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
  constructor() { }

  public getAllTabs(only_ui5: boolean = false): Promise<Page[]> {
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
}
