import { CodeStyles } from "../model/enum/CodeStyles";
import { Themes } from "../model/enum/Themes";

export type AppSettings = {
    codeStyle: CodeStyles;
    reloadPageDefault: boolean;
    manualReplayMode: boolean;
    replayDelay: number;
    theme: Themes;
}

export default class SettingsStorageService {
    private constructor() { }
    public static getDefaults(): AppSettings {
        return {
            codeStyle: CodeStyles.OPA5,
            reloadPageDefault: true,
            manualReplayMode: true,
            replayDelay: 0.5,
            theme: Themes.QUARTZ_LIGHT
        };
    }

    public static async getSettings(): Promise<AppSettings> {
        const values = await chrome.storage.local.get('settings');
        if (values['settings']) {
            return JSON.parse(values.settings as string) as AppSettings;
        } else {
            return SettingsStorageService.getDefaults();
        }
    }

    public static async save(settings?: AppSettings): Promise<AppSettings> {
        if (settings) {
            const storage: { [key: string]: string } = {};
            storage['settings'] = JSON.stringify(settings);
            await chrome.storage.local.set(storage);
            return settings;
        } else {
            return settings;
        }
    }
}