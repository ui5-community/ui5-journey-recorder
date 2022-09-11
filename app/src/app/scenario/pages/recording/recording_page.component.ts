import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';

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

  constructor(
    private incommingRoute: ActivatedRoute,
    private chr_ext_srv: ChromeExtensionService,
    private dialog: MatDialog,
    private router: Router,
    private scenarioService: ScenarioService
  ) {}

  ngOnInit(): void {
    this.incommingRoute.params.subscribe((params: Params) => {
      this.chr_ext_srv
        .getTabInfoForCurrentConnection()
        .then((tab: chrome.tabs.Tab) => {
          this.tab = tab;
          this.openStopDialog();
        })
        .catch(() => {
          this.chr_ext_srv.disconnect();
          this.router.navigate(['']);
        });
    });
  }

  private openStopDialog(): void {
    const ref = this.dialog.open(RecordStopDialogComponent, {
      disableClose: true,
      panelClass: 'stopDialog',
    });

    ref.afterClosed().subscribe((steps) => {
      this.postRecordActions(steps);
    });
  }

  private async postRecordActions(events: Event[]): Promise<void> {
    const { id } = await this.scenarioService.createScenarioFromRecording(
      events
    );

    this.router.navigate(['scenario/scenarioDetail', id]);
  }
}
