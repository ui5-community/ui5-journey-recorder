import { Component, Input, OnInit } from '@angular/core';
import {
  ChromeExtensionService,
  Page,
} from 'src/app/services/chromeExtensionService/chrome_extension_service';
//#region prime-ng
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { AppFooterService } from 'src/app/components/app-footer/app-footer.service';
import { TestScenario } from 'src/app/classes/testScenario';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
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
    private appHeaderService: AppHeaderService,
    public scenarioService: ScenarioService
  ) {}

  ngOnInit(): void {
    this.appHeaderService.hideBack();
    ChromeExtensionService.get_all_tabs().then((tabs: Page[]) => {
      this.raw_elements = tabs;
      this.filterEntries('');
    });
  }

  connect_to_page(page: Page | undefined) {
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

  removeScenario(scen: TestScenario) {
    this.scenarioService.deleteScenario(scen).then(() => {
      this.messageService.clear();
      this.messageService.add({
        severity: 'success',
        summary: 'Remove',
        detail: 'Scenario deleted!',
      });
      this.loadScenarios();
    });
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
    this.router.navigate(['scenario/scenarioDetail', scenario.id]);
  }

  handleChange(e: { originalEvent: any; index: number }) {
    if (e.index === 1) {
      this.loadScenarios();
    }
  }

  importScenario() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', ($event: Event) => {
      const files = ($event.currentTarget as HTMLInputElement).files;
      const reader = new FileReader();
      reader.onload = (input) => {
        const content = input.target?.result as string;
        if (content) {
          this.importFinished(JSON.parse(content));
        }
      };
      if (files) {
        reader.readAsText(files[0]);
      }
    });
    input.click();
  }

  private loadScenarios(): void {
    this.scenarioService.getAllScenarios().then((scenarios: TestScenario[]) => {
      this.scenarios = scenarios?.sort(
        (sc1: TestScenario, sc2: TestScenario) =>
          sc2.latestEdit - sc1.latestEdit
      );
    });
  }

  private async importFinished(content: { [key: string]: any }): Promise<void> {
    const scen_id = content['scenario_id'];
    const scen = await this.scenarioService.getScenario(scen_id);
    if (scen) {
      this.confirmationService.confirm({
        icon: 'pi pi-exclamation-triangle',
        header: 'Scenario already exists!',
        message: 'A scenario with the same id already exists, override?',
        accept: async () => {
          await this.scenarioService.saveScenario(
            TestScenario.fromJSON(JSON.stringify(content))
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Import',
            detail: 'Scenario imported',
          });
          this.loadScenarios();
        },
      });
    } else {
      await this.scenarioService.saveScenario(
        TestScenario.fromJSON(JSON.stringify(content))
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Import',
        detail: 'Scenario imported',
      });
      this.loadScenarios();
    }
  }
}
