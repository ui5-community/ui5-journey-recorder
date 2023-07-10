import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  title: string = '';
  description: string = '';
  icon?: string;
  severity: string = '';
  withConfirmOption?: boolean;
  optionChecked: boolean = false;
  confirmText: string = '';
  constructor(
    private ref: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      summary: string;
      detail: string;
      icon?: string;
      severity?: string;
      withConfOption?: boolean;
      confText?: string;
      defaultConfirmValue?: boolean;
    }
  ) {
    this.title = data.summary;
    this.description = data.detail;
    this.icon = data.icon;
    this.severity = data.severity || '';
    this.withConfirmOption = data.withConfOption || false;
    this.confirmText = data.confText || '';
    this.optionChecked = data.defaultConfirmValue || false;
  }

  close() {
    this.ref.close({ confirmOption: this.optionChecked });
  }
}
