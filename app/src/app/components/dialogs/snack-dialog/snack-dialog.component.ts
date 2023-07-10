import { Component, Inject, ViewEncapsulation } from '@angular/core';
import {
  MatLegacySnackBarConfig as MatSnackBarConfig,
  MatLegacySnackBarRef as MatSnackBarRef,
  MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA,
} from '@angular/material/legacy-snack-bar';

export enum SnackSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

@Component({
  selector: 'app-snack-dialog',
  templateUrl: './snack-dialog.component.html',
  styleUrls: ['./snack-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SnackDialogComponent {
  title: string = '';
  description: string = '';
  severity: string = '';
  icon: string = '';

  constructor(
    @Inject(MAT_SNACK_BAR_DATA)
    data: {
      severity?: SnackSeverity;
      title: string;
      detail?: string;
      icon?: string;
    },
    public ref: MatSnackBarRef<SnackDialogComponent>
  ) {
    this.title = data.title;
    this.description = data?.detail ? data.detail : '';
    this.icon = '';
    if (data?.icon || data?.severity) {
      if (data?.icon) {
        this.icon = data?.icon;
      } else if (data?.severity) {
        switch (data.severity) {
          case SnackSeverity.SUCCESS: {
            this.icon = 'check';
            break;
          }
          case SnackSeverity.WARNING: {
            this.icon = 'warning';
            break;
          }
          case SnackSeverity.ERROR: {
            this.icon = 'report';
            break;
          }
          case SnackSeverity.INFO: {
            this.icon = 'info';
            break;
          }
          default: {
            this.icon = '';
          }
        }
      }
    }
    this.severity = data?.severity ? data?.severity : '';
  }
}
