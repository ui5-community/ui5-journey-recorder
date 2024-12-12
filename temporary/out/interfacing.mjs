import * as fs from 'fs';
import JourneyGenerator from './JourneyGenerator.mjs';
import wdi5Generator from './wdi5Generator.mjs';
const sJsonContent = fs.readFileSync('./out/Demo.json', { encoding: 'utf-8' });
const oJsonContent = JSON.parse(sJsonContent);
class Logger {
    static log(sText = "") {
        console.log(this._createPrefix(), sText);
    }
    static _createPrefix() {
        const oDateTime = new Date();
        return `${('' + oDateTime.getUTCDate()).padStart(2, '0')}-${('' + (oDateTime.getUTCMonth() + 1)).padStart(2, '0')}-${oDateTime.getUTCFullYear()} ${('' + oDateTime.getUTCHours()).padStart(2, '0')}:${('' + oDateTime.getUTCMinutes()).padStart(2, '0')}:${('' + oDateTime.getUTCSeconds()).padStart(2, '0')} - `;
    }
}
const oJourney = new JourneyGenerator().setJourneyJSON(oJsonContent);
const oWdi5 = new wdi5Generator().setJourneyJSON(oJsonContent);
['JS', 'TS'].forEach(sType => {
    const sOPAJourneyPath = `./target/integration/${sType}/Journey.${sType.toLocaleLowerCase()}`;
    fs.writeFileSync(sOPAJourneyPath, oJourney.generate(sType === 'TS'));
    Logger.log(sOPAJourneyPath);
    oJourney.generatePages(sType === 'TS').forEach((oP) => {
        const sFilePath = `./target/integration/${sType}/pages/${oP.pageName}Page.${sType.toLocaleLowerCase()}`;
        fs.writeFileSync(sFilePath, oP.pageContent);
        Logger.log(sFilePath);
    });
    const sWdi5JourneyPath = `./target/e2e/${sType}/Journey.${sType.toLocaleLowerCase()}`;
    fs.writeFileSync(sWdi5JourneyPath, oWdi5.generate(sType === 'TS'));
    Logger.log(sWdi5JourneyPath);
    oWdi5.generatePages(sType === 'TS').forEach((oP) => {
        const sFilePath = `./target/e2e/${sType}/pages/${oP.pageName}Page.${sType.toLocaleLowerCase()}`;
        fs.writeFileSync(sFilePath, oP.pageContent);
        Logger.log(sFilePath);
    });
});
