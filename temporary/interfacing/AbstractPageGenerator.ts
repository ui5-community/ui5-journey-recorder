import AbstractGenerator from './AbstractGenerator';

export default abstract class PageGenerator extends AbstractGenerator {
    abstract generate(bTS: boolean): string;
    abstract addMethod(oStep: Record<string, unknown>): void;
}