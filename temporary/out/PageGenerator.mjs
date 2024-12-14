import Generator from './Generator.mjs';
export default class PageGenerator extends Generator {
    _createStepSelector(oStep) {
        let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
        return sStepSelector.replaceAll(/\n/gm, '\n\t\t\t\t\t');
    }
}
