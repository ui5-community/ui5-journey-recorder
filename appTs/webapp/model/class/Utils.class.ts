export default class Utils {
    public static replaceUnsupportedFileSigns(text: string, replacementSign: string) {
        return text.replace(/[\s/\\:*?"<>|-]+/gm, replacementSign);
    }
}