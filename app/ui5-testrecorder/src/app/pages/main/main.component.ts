import { Component, Input, OnInit } from '@angular/core';
import {
  ChromeExtensionService,
  Page,
} from 'src/app/services/chromeExtensionService/chrome_extension_service';
//#region prime-ng
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { AppFooterService } from 'src/app/components/app-footer/app-footer.service';
import { TestScenario } from 'src/app/services/classes/testScenario';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
//#endregion

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  @Input()
  public replay: boolean = false;

  raw_elements: Page[] = [];
  elements: Page[] = [];
  scenarios: TestScenario[] = [];
  columns: any[] = [
    { field: 'icon', header: '' },
    //{ field: "id", header: "Tab ID" },
    { field: 'title', header: 'Page Title' },
    { field: 'path', header: 'Page Url' },
  ];

  selected_row: Page | undefined;

  constructor(
    private chr_ext_srv: ChromeExtensionService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appFooterService: AppFooterService,
    public scenarioService: ScenarioService
  ) {}

  ngOnInit(): void {
    ChromeExtensionService.get_all_tabs().then((tabs: Page[]) => {
      this.raw_elements = tabs;
      this.filterEntries('');
    });
  }

  connect_to_page(page: Page | undefined) {
    this.appFooterService.connecting();
    if (page) {
      this.confirmationService.confirm({
        icon: 'pi pi-sign-in',
        header: 'Connect to Page',
        message: 'Connect to the page and inject analytic scripts?',
        accept: () => {
          this.chr_ext_srv.setCurrentPage(page);
          this.chr_ext_srv
            .connectToCurrentPage()
            .then(() => {
              this.chr_ext_srv.focus_page(page).then(() => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Injection',
                  detail: 'Connection established!',
                });
                this.appFooterService.connected();
                this.router.navigate(['scenario/recording'], {
                  relativeTo: this.activatedRoute,
                });
              });
            })
            .catch(() => {
              this.messageService.add({
                severity: 'error',
                summary: 'Injection',
                detail: 'Connection could not established!',
              });
            });
        },
      });
    }
  }

  refresh_table() {
    ChromeExtensionService.get_all_tabs().then((tabs: Page[]) => {
      this.elements = tabs;
    });
  }

  checkKeyPress(event: any, page: Page | undefined) {
    if (event.code === 'Space' || event.code === 'Enter') {
      this.connect_to_page(page);
    }
  }

  searchChange(event: { [key: string]: any }) {
    const searchString = event['target'].value;
    this.filterEntries(searchString);
  }

  onSearch(event: any) {
    const searchString = event['target'].value;
    this.filterEntries(searchString);
  }

  private filterEntries(search: string) {
    if (!search) {
      this.elements = this.raw_elements.map((el) => el);
    }
    const parts = search.split(' ');
    let intermediateResult = this.raw_elements;
    for (let part of parts) {
      intermediateResult = this.raw_elements.filter((el) => {
        return el.path.includes(part) || el.title.includes(part);
      });
    }
    this.elements = intermediateResult;
  }

  openExisting(scenario: TestScenario): void {
    this.router.navigate(['scenario/scenarioView', scenario.id]);
  }

  handleChange(e: { originalEvent: any; index: number }) {
    if (e.index === 1) {
      this.scenarioService
        .getAllScenarios()
        .then((scenarios: TestScenario[]) => {
          this.scenarios = scenarios;
        });
    }
  }
}
