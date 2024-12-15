export default abstract class Generator {

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