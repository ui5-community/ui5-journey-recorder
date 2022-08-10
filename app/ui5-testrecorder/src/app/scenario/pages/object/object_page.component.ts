import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ChromeExtensionService } from 'src/app/services/chromeExtensionService/chrome_extension_service';
import { Observable } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { RecordStopDialogComponent } from '../../dialogs/RecordStopDialog/RecordStopDialog.component';
import {
  Page,
  Step,
  TestScenario,
} from 'src/app/services/classes/testScenario';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';

@Component({
  selector: 'app-object-page',
  templateUrl: './object_page.component.html',
  styleUrls: ['./object_page.component.css'],
})
export class ObjectPageComponent implements OnInit {
  navigatedPage: string = 'Test';
  tab: chrome.tabs.Tab | undefined;
  recordingObs: Observable<any>;

  steps: any[] = [];
  scenario: TestScenario | undefined;
  scenarioSteps: Step[] = [];

  private scenario_id: string = '';

  constructor(
    private location: Location,
    private incommingRoute: ActivatedRoute,
    private chr_ext_srv: ChromeExtensionService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private dialogService: DialogService,
    private scenarioService: ScenarioService
  ) {
    this.recordingObs = this.chr_ext_srv.register_recording_websocket();
  }

  ngOnInit(): void {
    this.incommingRoute.params.subscribe((params: Params) => {
      this.scenario_id = params['scenarioId'];
      this.scenarioService
        .getScenario(this.scenario_id)
        .then((scen: TestScenario) => {
          this.scenario = scen;
          this.scenarioSteps = scen.testPages.reduce(
            (a, b) => [...a, ...b.steps],
            [] as Step[]
          );
        })
        .catch(() => this.navBack.bind(this));
    });
  }

  navBack(): void {
    this.chr_ext_srv.disconnect();
    this.router.navigate(['']);
  }

  saveCurrentScenario(): void {
    if (this.scenario) {
      this.scenarioService.saveScenario(this.scenario);
    }
  }
}
