import Generator from './Generator';

export default abstract class PageGenerator extends Generator {
    abstract generate(bTS: boolean): string;
    abstract addMethod(oStep: Record<string, unknown>): void;

    _createStepSelector(oStep: Record<string, unknown>): string {
        let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
        return sStepSelector.replaceAll(/\n/gm, '\n\t\t\t\t\t');
    }
}