import { Component, Input, OnInit } from '@angular/core';
import {
  ChromeExtensionService,
  Page,
} from 'src/app/services/chromeExtensionService/chrome_extension_service';
//#region prime-ng
import { ActivatedRoute, Router } from '@angular/router';
import { TestScenario } from 'src/app/classes/testScenario';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { SnackSeverity } from 'src/app/components/dialogs/snack-dialog/snack-dialog.component';
//#endregion

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  @Input()
  public replay: boolean = false;

  raw_elements: Page[] = [];
  elements: Page[] = [];
  raw_scenarios: TestScenario[] = [];
  scenarios: TestScenario[] = [];

  selected_row: Page | undefined;

  searchValueTabs: string = '';
  searchValueScenarios: string = '';

  private tabIndex: number = 0;
  private timerIndex: number = 0;

  constructor(
    private chr_ext_srv: ChromeExtensionService,
    private messageService: MessageService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appHeaderService: AppHeaderService,
    public scenarioService: ScenarioService
  ) {}

  ngOnInit(): void {
    this.appHeaderService.hideBack();
    this.loadTabs();
    this.timerIndex = setInterval(
      this.loadTabs.bind(this),
      3000 //refresh every 3sec
    );
  }

  connect_to_page(page: Page | undefined) {
    if (page) {
      this.messageService.confirm({
        icon: 'login',
        title: 'Connect to Page',
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
              this.messageService.show({
                severity: SnackSeverity.ERROR,
                title: 'Injection',
                detail: 'Connection could not established!',
              });
            });
        },
      });
    }
  }

  refresh_table() {
    this.loadTabs();
  }

  checkKeyPress(event: any, page: Page | undefined) {
    if (event.code === 'Space' || event.code === 'Enter') {
      this.connect_to_page(page);
    }
  }

  searchChange(searchString: string) {
    if (this.tabIndex === 1) {
      this.filterScenarios(searchString);
    } else if (this.tabIndex === 0) {
      this.filterTabs(searchString);
    }
  }

  removeScenario(scen: TestScenario) {
    this.scenarioService.deleteScenario(scen).then(() => {
      this.messageService.show({
        severity: SnackSeverity.SUCCESS,
        title: 'Remove',
        detail: 'Scenario deleted!',
      });
      this.loadScenarios();
    });
  }

  openExisting(scenario: TestScenario): void {
    this.router.navigate(['scenario/scenarioDetail', scenario.id]);
  }

  handleChange(index: number) {
    this.tabIndex = index;
    if (index === 1) {
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

  private loadTabs(): void {
    ChromeExtensionService.get_all_tabs().then((tabs: Page[]) => {
      this.raw_elements = tabs;
      this.filterTabs('');
    });
  }

  private filterScenarios(search: string) {
    if (!search) {
      this.scenarios = this.raw_scenarios.map((el) => el);
    }
    const parts = search.split(' ');
    let intermediateResult = this.raw_scenarios;
    for (let part of parts) {
      intermediateResult = this.raw_scenarios.filter((el) => {
        return el.startUrl.includes(part) || el.name.includes(part);
      });
    }
    this.scenarios = intermediateResult;
  }

  private filterTabs(search: string) {
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

  private loadScenarios(): void {
    this.scenarioService.getAllScenarios().then((scenarios: TestScenario[]) => {
      this.raw_scenarios = scenarios?.sort(
        (sc1: TestScenario, sc2: TestScenario) =>
          sc2.latestEdit - sc1.latestEdit
      );
      this.filterScenarios('');
    });
  }

  private async importFinished(content: { [key: string]: any }): Promise<void> {
    const scen_id = content['scenario_id'];
    const scen = await this.scenarioService.getScenario(scen_id);
    if (scen) {
      this.messageService.confirm({
        severity: 'error',
        icon: 'error',
        title: 'Scenario already exists!',
        message: 'A scenario with the same id already exists, override?',
        accept: async () => {
          await this.scenarioService.saveScenario(
            TestScenario.fromJSON(JSON.stringify(content))
          );
          this.messageService.show({
            severity: SnackSeverity.SUCCESS,
            title: 'Import',
            detail: 'Scenario imported',
          });
          this.loadScenarios();
        },
      });
    } else {
      await this.scenarioService.saveScenario(
        TestScenario.fromJSON(JSON.stringify(content))
      );
      this.messageService.show({
        severity: SnackSeverity.SUCCESS,
        title: 'Import',
        detail: 'Scenario imported',
      });
      this.loadScenarios();
    }
  }
}
