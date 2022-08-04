import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  templateUrl: './RecordStopDialog.component.html',
  styleUrls: ['./RecordStopDialog.component.css']
})
export class RecordStopDialogComponent {
  constructor(private ref: DynamicDialogRef, public config: DynamicDialogConfig) { }

  ngOnInit() {

  }

  stopRecording(): void {
    this.ref.close();
  }
}
