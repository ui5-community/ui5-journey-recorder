import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './RecordStopDialog.component.html',
  styleUrls: ['./RecordStopDialog.component.scss'],
})
export class RecordStopDialogComponent {
  constructor(private ref: MatDialogRef<RecordStopDialogComponent>) {}

  ngOnInit() {}

  stopRecording(): void {
    this.ref.close();
  }
}
