import { Step } from "../model/class/Step.class";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import SettingsStorageService from "./SettingsStorage.service";

export default class CodeGenerationService {
    private constructor() { }

    public static generateJourneyCode(): { title: string; code: string; type: 'journey' | 'page' }[] {
        return [];
    }

    public static generateStepCode(
        testStep: Step,
        style: TestFrameworks
    ): string {
        const framework = style || SettingsStorageService.getDefaults().testFramework;
        switch (framework) {
            case TestFrameworks.OPA5:
                break;
            case TestFrameworks.WDI5:
                break;
            default:
                return '';
        }
    }
}