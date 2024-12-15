import Generator from './Generator';

export type MethodParameters = { "method-name": string, "success-message": string, "error-message": string, "action-type": string, "action-create"?: string };

export abstract class PageGenerator extends Generator {
    _view_path: string = "";
    _view_hash: string = "";
    _actions: MethodParameters[] = [];
    _validations: MethodParameters[] = [];
    _action_imports: string[] = [];
    _control_imports: string[] = [];

    constructor(sViewName: string, sPageHash: string) {
        super();
        this._view_path = sViewName;
        this._view_hash = sPageHash;
    }

    abstract generate(bTS: boolean): string;
    abstract addMethod(oStep: Record<string, unknown>): void;

    _createStepSelector(oStep: Record<string, unknown>): string {
        let sStepSelector = JSON.stringify(oStep.recordReplaySelector, null, 2);
        return sStepSelector.replaceAll(/\n/gm, '\n\t\t\t\t\t');
    }
}