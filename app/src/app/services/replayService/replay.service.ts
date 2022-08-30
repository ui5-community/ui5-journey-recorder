import { Injectable } from '@angular/core';
import { ChromeExtensionService } from '../chromeExtensionService/chrome_extension_service';
import { RequestBuilder, RequestMethod } from '../../classes/requestBuilder';
import { Step } from '../../classes/testScenario';

@Injectable({ providedIn: 'root' })
export class ReplayService {
  constructor(private chr_ext_srv: ChromeExtensionService) {}

  public startReplay(startUrl: string): Promise<void> {
    return this.chr_ext_srv
      .createTabByUrl(startUrl)
      .then((tab: chrome.tabs.Tab) => {
        const p = {
          title: tab.title || '',
          path: tab.url || tab.pendingUrl || '',
          id: tab.id || 0,
          icon: tab.favIconUrl || '',
        };
        this.chr_ext_srv.setCurrentPage(p);
        return this.chr_ext_srv.focus_page(p).then(() => {
          return this.chr_ext_srv.connectToCurrentPage();
        });
      });
  }

  public stopReplay(): Promise<void> {
    return this.chr_ext_srv.disconnect();
  }

  public performAction(step: Step): Promise<void> {
    const rb = new RequestBuilder();
    rb.setMethod(RequestMethod.POST);
    rb.setUrl('/controls/action');
    rb.setBody(step);
    return this.chr_ext_srv.sendSyncMessage(rb.build());
  }
}
