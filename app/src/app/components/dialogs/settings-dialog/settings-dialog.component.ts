import { Component, OnInit } from '@angular/core';
import { MatLegacyCheckboxChange as MatCheckboxChange } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { MatLegacyRadioChange as MatRadioChange } from '@angular/material/legacy-radio';
import { MatLegacySelectChange as MatSelectChange } from '@angular/material/legacy-select';
import { CodeStyles } from 'src/app/scenario/codeService/codeService.service';
import {
  AppSettings,
  SettingsStorageService,
} from 'src/app/services/localStorageService/settingsStorageService.service';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss'],
})
export class SettingsDialogComponent implements OnInit {
  settings?: AppSettings;

  codeLanguages = [
    { name: 'OPA5', value: CodeStyles.OPA5 },
    { name: 'Wdi5', value: CodeStyles.WDI5 },
  ];

  constructor(
    private ref: MatDialogRef<SettingsDialogComponent>,
    private settingsService: SettingsStorageService
  ) {}

  ngOnInit() {
    this.settings = this.settingsService.settings;
  }

  close() {
    this.settingsService.save(this.settings).then((r: AppSettings) => {
      this.settings = r;
      this.ref.close();
    });
  }

  languageChanged(event: MatSelectChange): void {
    if (!this.settings) {
      this.settings = SettingsStorageService.getDefaults();
    }
    this.settings.codeStyle = event.value;
  }

  reloadChanged(event: MatCheckboxChange): void {
    if (!this.settings) {
      this.settings = SettingsStorageService.getDefaults();
    }
    this.settings.reloadPageDefault = event.checked;
  }

  manualReplayChanged(event: MatCheckboxChange): void {
    if (!this.settings) {
      this.settings = SettingsStorageService.getDefaults();
    }
    this.settings.manualReplayMode = event.checked;
  }

  replayDelayChanged(event: MatRadioChange): void {
    if (!this.settings) {
      this.settings = SettingsStorageService.getDefaults();
    }
    this.settings.replayDelay = Number(event.value);
  }
}
