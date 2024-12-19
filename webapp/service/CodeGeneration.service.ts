import { stringify } from "querystring";
import JourneyGenerator from "../model/class/generator/common/JourneyGenerator.class";
import OPA5Journey from "../model/class/generator/opa5/OPA5Journey.class";
import Wdi5Journey from "../model/class/generator/wdi5/Wdi5Journey.class";
import Journey from "../model/class/Journey.class";
import { Step } from "../model/class/Step.class";
import { TestFrameworks, CodeStyles } from "../model/enum/TestFrameworks";
import SettingsStorageService from "./SettingsStorage.service";

export default class CodeGenerationService {
    private constructor() { }

    public static async generateJourneyCode(journey: Journey, options?: {
        framework: TestFrameworks,
        style: CodeStyles
    }): Promise<{ title: string; code: string; type: 'journey' | 'page' }[]> {
        const framework = options?.framework || (await SettingsStorageService.getSettings()).testFramework;
        const codeStyle = options?.style || (await SettingsStorageService.getSettings()).testStyle;
        let oGenerator: JourneyGenerator;
        switch (framework) {
            case TestFrameworks.OPA5:
                oGenerator = new OPA5Journey(journey);
                break;
            case TestFrameworks.WDI5:
                oGenerator = new Wdi5Journey(journey);
                break;
            default:
                //selected framework is not available therefore no code can be generated
                return [];
        }
        const aContent: { title: string; code: string; type: 'journey' | 'page' }[] = [];
        aContent.push({
            title: journey.name,
            code: oGenerator.generate(codeStyle === CodeStyles.TypeScript),
            type: 'journey'
        });
        oGenerator.generatePages(codeStyle === CodeStyles.TypeScript).forEach((oPageDesc: { pageName: string, pageContent: string }) => {
            aContent.push({ title: oPageDesc.pageName, code: oPageDesc.pageContent, type: 'page' });
        })
        return aContent;
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