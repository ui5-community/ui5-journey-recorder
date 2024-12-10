import AbstractPageGenerator from './AbstractPageGenerator';

export default abstract class RootTemplate {
    _testName = "";
    _steps: {
        "step-comment": string,
        "step-type": string,
        "step-selector": string,
        "page-name": string,
        "function-name": string,
        "step"?: Record<string, unknown>
    }[] = [];
    _pages: Record<string, unknown> = {};

    _genMethodNameForStep(oStepJSON: Record<string, unknown>): string {

        const sMethodName: string[] = [];
        const aClassSpecifier = ((oStepJSON.control as Record<string, unknown>).type as string).split('.');

        switch (oStepJSON.actionType) {
            case 'input':
                sMethodName.push('iType_');
                sMethodName.push((oStepJSON.keys as Record<string, unknown>[]).reduce((agg: string, o: Record<string, unknown>) => agg + o.key, ''));
                sMethodName.push('_IntoThe');
                sMethodName.push(this._capitalizeFirstLetter(aClassSpecifier[aClassSpecifier.length - 1]));
                break;
            case 'clicked':
                sMethodName.push('iPress');
                sMethodName.push('The');
                sMethodName.push(this._capitalizeFirstLetter(aClassSpecifier[aClassSpecifier.length - 1]));
                break;
            case 'validate':
                sMethodName.push('iShouldSeeThe');
                sMethodName.push(this._capitalizeFirstLetter(aClassSpecifier[aClassSpecifier.length - 1]));
                break;
            default:
                sMethodName.push('xxx');
        }
        return sMethodName.join('');
    }

    _replacePlaceholders(template: string, placeholders: Record<string, string>): string {
        return Object.keys(placeholders).reduce(
            (updatedTemplate, key) => updatedTemplate.replaceAll(`{{${key}}}`, placeholders[key]),
            template
        );
    }

    _extractJourneyName(oJourneyJSON: Record<string, unknown>): void {
        this._testName = oJourneyJSON["name"] as string;
    }

    _extractSteps(oJourneyJSON: Record<string, unknown>): void {
        const aSteps = oJourneyJSON["steps"] as Record<string, unknown>[];
        this._steps = aSteps.map((oStep: Record<string, unknown>) => {
            const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sComment = (bAssertion ? ' Assertion' : ' Action') + (oStep.comment ? `: ${oStep.comment}` : '');
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;
            let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
            sStepSelector = sStepSelector.replaceAll(/\n/gm, '\n\t\t');

            if (!this._pages[sPageName]) {
                const oViewInfos = oStep["viewInfos"] as { absoluteViewName: string, relativeViewName: string };
                this._pages[sPageName] = this._getPageGenerator(oViewInfos.absoluteViewName);
            }

            (this._pages[sPageName] as AbstractPageGenerator).addMethod((oStep as Record<string, unknown>));

            return {
                "step-comment": sComment,
                "step-type": sType,
                "step-selector": sStepSelector,
                "page-name": sPageName,
                "function-name": sMethodName,
                "step": oStep
            }
        });
    }

    abstract _getPageGenerator(sPageName: string): AbstractPageGenerator;

    private _capitalizeFirstLetter(sString: string): string {
        const oNumberMap: Record<string, string> = {
            '0': 'First',
            '1': 'Second',
            '2': 'Third',
        };
        if (isNaN(Number(sString))) {
            return String(sString).charAt(0).toUpperCase() + String(sString).slice(1);
        } else {
            let sNumberWord = oNumberMap[sString];
            sNumberWord = sNumberWord ? sNumberWord : (Number(sString) + 1) + 'th';
            return sNumberWord;
        }
    }
}