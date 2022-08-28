import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';

import { ChromeExtensionService } from 'src/app/services/chromeExtensionService/chrome_extension_service';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { RecordStopDialogComponent } from '../../dialogs/RecordStopDialog/RecordStopDialog.component';

@Component({
  selector: 'app-recording-page',
  templateUrl: './recording_page.component.html',
  styleUrls: ['./recording_page.component.scss'],
})
export class RecordingPageComponent implements OnInit {
  tab: chrome.tabs.Tab | undefined;
  recordingObs: Observable<any>;
  steps: any[] = [];

  constructor(
    private incommingRoute: ActivatedRoute,
    private chr_ext_srv: ChromeExtensionService,
    private cd: ChangeDetectorRef,
    private dialogService: DialogService,
    private router: Router,
    private scenarioService: ScenarioService
  ) {
    this.recordingObs = this.chr_ext_srv.register_recording_websocket();
  }

  ngOnInit(): void {
    this.incommingRoute.params.subscribe((params: Params) => {
      this.chr_ext_srv
        .getTabInfoForCurrentConnection()
        .then((tab: chrome.tabs.Tab) => {
          this.tab = tab;
          this.recordingObs.subscribe(this.onRecordStep.bind(this));
          this.openStopDialog();
        })
        .catch(() => {
          this.chr_ext_srv.disconnect();
          this.router.navigate(['']);
        });
    });
  }

  private onRecordStep(step: any): void {
    this.steps.push(step);
    this.cd.detectChanges();
  }

  private openStopDialog(): void {
    const ref = this.dialogService.open(RecordStopDialogComponent, {
      closable: false,
      styleClass: 'stopDialog',
      showHeader: false,
    });

    ref.onClose.subscribe((_) => {
      this.postRecordActions();
    });
  }

  private async postRecordActions(): Promise<void> {
    const { id } = await this.scenarioService.createScenarioFromRecording(
      this.steps
    );

    this.router.navigate(['scenario/scenarioDetail', id]);
  }
}
