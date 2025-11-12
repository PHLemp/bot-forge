import { REDFIELD_ID } from "../model/constants";

export class TextUtils {
    static getRandomTextFromArray(values: string[]): string {
        if (values && values.length > 0) {
            const randomIndex = Math.floor(Math.random() * values.length);
            return values[randomIndex];
        }

        return `There is a missing TEXT, please send a screenshot with this message to REDFIELD (<@${REDFIELD_ID}>)`;
    }

    public static getTruncatedText(text: string, maxLength: number = 20): string {
        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength) + '...';
    }
}