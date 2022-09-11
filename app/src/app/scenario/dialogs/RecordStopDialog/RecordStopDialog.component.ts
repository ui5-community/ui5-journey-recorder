import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { pipe, Subject, Subscription, takeUntil } from 'rxjs';
import { ChromeExtensionService } from 'src/app/services/chromeExtensionService/chrome_extension_service';

@Component({
  templateUrl: './RecordStopDialog.component.html',
  styleUrls: ['./RecordStopDialog.component.scss'],
})
export class RecordStopDialogComponent implements OnInit, OnDestroy {
  private unsubscribe$?: Subject<void>;
  private steps: any[] = [];

  constructor(
    private ref: MatDialogRef<RecordStopDialogComponent>,
    private chr_ext_srv: ChromeExtensionService
  ) {}

  ngOnInit(): void {
    this.unsubscribe$ = new Subject();
    this.chr_ext_srv
      .register_recording_websocket()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(this.onRecordStep.bind(this));
  }

  ngOnDestroy(): void {
    if (this.unsubscribe$) {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  }

  stopRecording(): void {
    this.ref.close([...this.steps]);
  }

  private onRecordStep(step: any): void {
    this.steps.push(step);
  }
}
