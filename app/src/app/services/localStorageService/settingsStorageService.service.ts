import { Inject } from '@angular/core';
import { CodeStyles } from 'src/app/scenario/codeService/codeService.service';

export type AppSettings = { codeStyle: CodeStyles };

@Inject({
  providedIn: 'root',
})
export class SettingsStorageService {
  private _settings!: AppSettings;
  constructor() {
    this.setDefaults();
    this.initService();
  }

  private setDefaults() {
    this._settings = { codeStyle: CodeStyles.OPA5 };
  }

  private async initService(): Promise<void> {
    const values = await chrome.storage.local.get('settings');
    if (values['settings']) {
      this._settings = JSON.parse(values['settings']);
    }
  }

  public get settings(): AppSettings {
    return this._settings;
  }

  public get codeStyle(): CodeStyles {
    return this._settings.codeStyle;
  }

  public set codeStyle(style: CodeStyles) {
    this._settings.codeStyle = style;

    const storage: { [key: string]: string } = {};
    storage['settings'] = JSON.stringify(this._settings);
    chrome.storage.local.set(storage);
  }

  public save(settings?: AppSettings): Promise<AppSettings> {
    if (settings) {
      const storage: { [key: string]: string } = {};
      storage['settings'] = JSON.stringify(settings);
      return chrome.storage.local.set(storage).then(() => {
        this._settings = settings;
        return { ...this._settings };
      });
    } else {
      return Promise.resolve({ ...this._settings });
    }
  }
}
