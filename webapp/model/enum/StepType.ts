export enum StepType {
    CLICK = 'clicked',
    INPUT = 'input',
    KEYPRESS = 'keypress',
    UNKNOWN = 'unknown',
    VALIDATION = 'validate',
}

export type CodePage = {
    title: string;
    code: string;
    type: 'journey' | 'page';
};