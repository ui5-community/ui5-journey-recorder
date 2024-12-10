export default class RootTemplate {
    _testName = "";
    _steps = [];
    _pages = {};
    _genMethodNameForStep(oStepJSON) {
        const sMethodName = [];
        const aClassSpecifier = oStepJSON.control.type.split('.');
        switch (oStepJSON.actionType) {
            case 'input':
                sMethodName.push('iType_');
                sMethodName.push(oStepJSON.keys.reduce((agg, o) => agg + o.key, ''));
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
    _replacePlaceholders(template, placeholders) {
        return Object.keys(placeholders).reduce((updatedTemplate, key) => updatedTemplate.replaceAll(`{{${key}}}`, placeholders[key]), template);
    }
    _extractJourneyName(oJourneyJSON) {
        this._testName = oJourneyJSON["name"];
    }
    _extractSteps(oJourneyJSON) {
        const aSteps = oJourneyJSON["steps"];
        this._steps = aSteps.map((oStep) => {
            const oViewInfos = oStep["viewInfos"];
            const bAssertion = oStep["actionType"] === 'validate';
            const sMethodName = this._genMethodNameForStep(oStep);
            const sComment = (bAssertion ? ' Assertion' : ' Action') + (oStep.comment ? `: ${oStep.comment}` : '');
            const sType = bAssertion ? 'Then' : 'When';
            const sPageName = oViewInfos.relativeViewName;
            let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
            sStepSelector = sStepSelector.replaceAll(/\n/gm, '\n\t\t');
            if (!this._pages[sPageName]) {
                const oViewInfos = oStep["viewInfos"];
                this._pages[sPageName] = this._getPageGenerator(oViewInfos.absoluteViewName);
            }
            this._pages[sPageName].addMethod(oStep);
            return {
                "step-comment": sComment,
                "step-type": sType,
                "step-selector": sStepSelector,
                "page-name": sPageName,
                "function-name": sMethodName,
                "step": oStep
            };
        });
    }
    _capitalizeFirstLetter(sString) {
        const oNumberMap = {
            '0': 'First',
            '1': 'Second',
            '2': 'Third',
        };
        if (isNaN(Number(sString))) {
            return String(sString).charAt(0).toUpperCase() + String(sString).slice(1);
        }
        else {
            let sNumberWord = oNumberMap[sString];
            sNumberWord = sNumberWord ? sNumberWord : (Number(sString) + 1) + 'th';
            return sNumberWord;
        }
    }
}
