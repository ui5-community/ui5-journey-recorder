import Journey from "../model/class/Journey.class";
import { Step } from "../model/class/Step.class";
import OPA5CodeStrategy from "../model/class/codeStrategies/opa5/OPA5CodeStrategy.class";
import Wdi5CodeStrategy from "../model/class/codeStrategies/wdi5/Wdi5CodeStrategy.class";
import { TestFrameworks } from "../model/enum/TestFrameworks";
import SettingsStorageService from "./SettingsStorage.service";

export default class CodeGenerationService {
    private constructor() { }

    public static generateJourneyCode(journey: Journey, style?: TestFrameworks): { title: string; code: string; type: 'journey' | 'page' }[] {
        const framework = style || SettingsStorageService.getDefaults().testFramework;
        switch (framework) {
            case TestFrameworks.OPA5:
                return new OPA5CodeStrategy().generateJourneyCode(journey);
            case TestFrameworks.WDI5:
                return new Wdi5CodeStrategy().generateJourneyCode(journey);
            default:
                return [];
        }
    }

    public static generateStepCode(
        testStep: Step,
        style?: TestFrameworks
    ): string {
        const framework = style || SettingsStorageService.getDefaults().testFramework;
        switch (framework) {
            case TestFrameworks.OPA5:
                return OPA5CodeStrategy.generateStepCode(testStep);
            case TestFrameworks.WDI5:
                return Wdi5CodeStrategy.generateStepCode(testStep);
            default:
                return '';
        }
    }

    public static generatePagedStepCode(
        testStep: Step,
        testFramework?: TestFrameworks
    ) {
        const framework = testFramework || SettingsStorageService.getDefaults().testFramework
        switch (framework) {
            case TestFrameworks.OPA5:
                return new OPA5CodeStrategy().generatePagedStepCode(testStep);
            case TestFrameworks.WDI5:
                return new Wdi5CodeStrategy().generatePagedStepCode(testStep);
            default:
                return '';
        }
    }
}