import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ChromeExtensionService } from 'src/app/services/chromeExtensionService/chrome_extension_service';
import { Observable } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { RecordStopDialogComponent } from '../../dialogs/RecordStopDialog/RecordStopDialog.component';
import { Page, Step, TestScenario } from 'src/app/classes/testScenario';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { ReplayService } from 'src/app/services/replayService/replay.service';
import { AppFooterService } from 'src/app/components/app-footer/app-footer.service';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { MessageService } from 'primeng/api';

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
  scenario: TestScenario = new TestScenario('0');
  scenarioSteps: Step[] = [];

  replay: boolean = false;

  private scenario_id: string = '';

  constructor(
    private location: Location,
    private incommingRoute: ActivatedRoute,
    private chr_ext_srv: ChromeExtensionService,
    private router: Router,
    private active_route: ActivatedRoute,
    private scenarioService: ScenarioService,
    private replayService: ReplayService,
    public app_footer_service: AppFooterService,
    private app_header_service: AppHeaderService,
    private messageService: MessageService
  ) {
    this.recordingObs = this.chr_ext_srv.register_recording_websocket();
  }

  ngOnInit(): void {
    this.app_header_service.showBack();
    this.app_header_service.setCustomBackUrl('');
    this.incommingRoute.params.subscribe((params: Params) => {
      this.scenario_id = params['scenarioId'];
      this.scenarioService
        .getScenario(this.scenario_id)
        .then((scen: TestScenario | undefined) => {
          if (!scen) {
            this.navBack();
          } else {
            this.scenario = scen;
            this.scenarioSteps = scen.testPages.reduce(
              (a, b) => [...a, ...b.steps],
              [] as Step[]
            );
          }
        })
        .catch(() => this.navBack.bind(this));
    });
  }

  navBack(): void {
    this.location.back();
  }

  saveCurrentScenario(): void {
    if (this.scenario) {
      this.scenarioService.saveScenario(this.scenario).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Save',
          detail: 'Current scenario saved!',
        });
      });
    }
  }

  replayMode() {
    if (this.scenario) {
      this.replayService.startReplay(this.scenario.startUrl).then(() => {
        this.replay = !this.replay;
      });
    }
  }

  stopReplay() {
    if (this.scenario) {
      this.replayService.stopReplay().then(() => {
        this.replay = !this.replay;
      });
    }
  }

  disconnect() {
    this.replayService.stopReplay();
  }

  connectToPage() {
    if (this.scenario) {
      this.replayService.startReplay(this.scenario?.startUrl);
    }
  }

  editViewStep(s: Step) {
    this.router.navigate(['step', encodeURIComponent(s.controlId)], {
      relativeTo: this.active_route,
    });
  }

  performAction(date: Step) {
    if (date) {
      this.replayService
        .performAction(date)
        .then(() => {})
        .catch();
    }
  }

  export() {
    const link = document.createElement('a');
    const blob = new Blob([this.scenario?.toString() || ''], {
      type: 'octet/stream',
    });
    const name =
      this.replaceUnsupportedFileSigns(this.scenario?.id || 'blub', '_') +
      '.json';

    link.setAttribute('href', window.URL.createObjectURL(blob));
    link.setAttribute('download', name);
    link.click();
  }

  private replaceUnsupportedFileSigns(
    text: string,
    replacement_sign: string
  ): string {
    return text.replace(/[\s\/\\\:\*\?\"\<\>\|\-]+/gm, replacement_sign);
  }
}
