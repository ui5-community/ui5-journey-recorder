import { CodeStyles, TestFrameworks } from "../model/enum/TestFrameworks";
import { Themes } from "../model/enum/Themes";

export type AppSettings = {
    framework: TestFrameworks;
    style: CodeStyles;
    pagedDefault: boolean;
    reloadPageDefault: boolean;
    manualReplayMode: boolean;
    replayDelay: number;
    theme: Themes;
    useRRSelector: boolean;
    showUI5only: boolean;
}

export default class SettingsStorageService {
    private constructor() { }
    public static getDefaults(): AppSettings {
        return {
            framework: TestFrameworks.OPA5,
            style: CodeStyles.ECMAScript,
            reloadPageDefault: true,
            manualReplayMode: true,
            replayDelay: 0.5,
            theme: Themes.QUARTZ_LIGHT,
            useRRSelector: true,
            showUI5only: false
        };
    }

    public static async getSettings(): Promise<AppSettings> {
        const values = await chrome.storage.local.get('settings');
        if (values['settings'] && typeof values['settings'] === 'string') {
            return JSON.parse(values.settings as string) as AppSettings;
        } else if (values['settings'] && typeof values['settings'] === 'object') {
            return values.settings as AppSettings;
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