export default class Utils {
    public static replaceUnsupportedFileSigns(text: string, replacementSign: string) {
        return text.replace(/[\s/\\:*?"<>|-]+/gm, replacementSign);
    }

    public static moveInArray<Type>(array: Type[], oldIndex: number, newIndex: number): Type[] {
        while (oldIndex < 0) {
            oldIndex += array.length;
        }
        while (newIndex < 0) {
            newIndex += array.length;
        }
        if (newIndex >= array.length) {
            let k = newIndex - array.length + 1;
            while (k--) {
                array.push(undefined);
            }
        }
        array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
        return array;
    }

    public static delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}