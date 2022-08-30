import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  title: string = '';
  description: string = '';
  icon: string | undefined;
  severity: string = '';
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      summary: string;
      detail: string;
      icon?: string;
      severity?: string;
    }
  ) {
    this.title = data.summary;
    this.description = data.detail;
    this.icon = data.icon;
    this.severity = data.severity || '';
  }
}
