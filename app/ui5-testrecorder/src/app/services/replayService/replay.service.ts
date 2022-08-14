import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppFooterService } from 'src/app/components/app-footer/app-footer.service';
import { ChromeExtensionService } from '../chromeExtensionService/chrome_extension_service';
import { Step } from '../classes/testScenario';

@Injectable({ providedIn: 'root' })
export class ReplayService {
  constructor(
    private chr_ext_srv: ChromeExtensionService,
    private appFooterService: AppFooterService,
    private messageService: MessageService
  ) {}

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
          return this.chr_ext_srv.connectToCurrentPage().then(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Injection',
              detail: 'Connection established!',
            });
            this.appFooterService.connected();
          });
        });
      });
  }

  public performAction(step: Step): Promise<void> {
    return this.chr_ext_srv.performAction(step);
  }
}
