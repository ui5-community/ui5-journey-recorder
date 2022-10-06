import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FloatLabelType } from '@angular/material/form-field';
import { SettingsStorageService } from 'src/app/services/localStorageService/settingsStorageService.service';
@Component({
  templateUrl: './ReplaySetupDialog.component.html',
  styleUrls: ['./ReplaySetupDialog.component.scss'],
})
export class ReplaySetupDialogComponent implements OnInit {
  manualModeControl = new FormControl(true);
  delayControl = new FormControl('0.5' as FloatLabelType);
  replayOptions = new FormGroup({
    manualMode: this.manualModeControl,
    delay: this.delayControl,
  });

  constructor(private ref: MatDialogRef<ReplaySetupDialogComponent>) {}

  ngOnInit() {
    if (this.manualModeControl.value === true) {
      this.delayControl.disable();
    } else {
      this.delayControl.enable();
    }

    this.manualModeControl.valueChanges.subscribe((val) => {
      if (val) {
        this.delayControl.disable();
      } else {
        this.delayControl.enable();
      }
    });
  }

  abort(): void {
    this.ref.close();
  }

  replayStart(): void {
    this.ref.close(this.replayOptions.value);
  }
}
