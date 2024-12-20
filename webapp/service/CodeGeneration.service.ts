import { stringify } from "querystring";
import JourneyGenerator from "../model/class/generator/common/JourneyGenerator.class";
import OPA5Journey from "../model/class/generator/opa5/OPA5Journey.class";
import Wdi5Journey from "../model/class/generator/wdi5/Wdi5Journey.class";
import Journey from "../model/class/Journey.class";
import { Step } from "../model/class/Step.class";
import { TestFrameworks, CodeStyles } from "../model/enum/TestFrameworks";
import SettingsStorageService from "./SettingsStorage.service";
import OPA5Page from "../model/class/generator/opa5/OPA5Page.class";
import Wdi5Page from "../model/class/generator/wdi5/Wdi5Page.class";
import { PageGenerator } from "../model/class/generator/common/PageGenerator.class";

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

    public static async generateStepCode(testStep: Step, options?: {
        framework: TestFrameworks,
        style: CodeStyles
    }): Promise<string> {
        const framework = options?.framework || (await SettingsStorageService.getSettings()).testFramework;
        const codeStyle = options?.style || (await SettingsStorageService.getSettings()).testStyle;
        const oViewInfos = testStep.viewInfos;
        let pageGenerator: PageGenerator;
        switch (framework) {
            case TestFrameworks.OPA5:
                pageGenerator = new OPA5Page(oViewInfos.absoluteViewName, testStep.actionLocation);
                break;
            case TestFrameworks.WDI5:
                pageGenerator = new Wdi5Page(oViewInfos.absoluteViewName, testStep.actionLocation);
                break;
            default:
                return '';
        }

        return pageGenerator.generateStepOnly(testStep, codeStyle === CodeStyles.TypeScript);
    }
}