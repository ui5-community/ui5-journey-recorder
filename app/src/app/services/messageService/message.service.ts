import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from 'src/app/components/dialogs/confirm-dialog/confirm-dialog.component';
import {
  SnackDialogComponent,
  SnackSeverity,
} from 'src/app/components/dialogs/snack-dialog/snack-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar, private dialog: MatDialog) {}

  public show(config: {
    severity?: SnackSeverity;
    title: string;
    detail?: string;
    icon?: string;
  }) {
    this._snackBar.openFromComponent(SnackDialogComponent, {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration: 5000,
      panelClass: 'app-snack-class',
      data: config,
    });
  }

  public confirm(params: {
    icon: string;
    title: string;
    message: string;
    severity?: string;
    withConfOption?: boolean;
    confText?: string;
    defaultConfirmValue?: boolean;
    accept?: (val: any) => void;
    dismiss?: () => void;
  }): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        icon: params.icon || '',
        summary: params.title,
        detail: params.message,
        severity: params.severity || '',
        withConfOption: params.withConfOption,
        confText: params.confText,
        defaultConfirmValue: params.defaultConfirmValue,
      },
    });
    dialogRef.afterClosed().subscribe((confOption: any) => {
      if (confOption) {
        if (params.accept) {
          params.accept(confOption);
        }
      } else {
        if (params.dismiss) {
          params.dismiss();
        }
      }
    });
  }
}
