import StringBuilder from "../StringBuilder.class";

export type CodePage = {
    title: string;
    code: string | StringBuilder;
    type: 'journey' | 'page';
};
