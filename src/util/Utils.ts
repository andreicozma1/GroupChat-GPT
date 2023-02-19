// return process.env.npm_package_version || "unknown";
import {version} from "./../../package.json";
import {copyToClipboard} from "quasar";
import {smartNotify} from "src/util/SmartNotify";

export const getAppVersion = () => {
    return version.trim();
};

export const charSum = (str: string): number =>
    !str.length ? 0 : str.charCodeAt(0) + charSum(str.substr(1));

export const sleepPromise = (ms: number) =>
    new Promise((r) => setTimeout(r, ms));

export const getRandomMinMax = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const copyClipboard = (text: string) => {
    copyToClipboard(text).then(() => {
        smartNotify(`Copied to clipboard`);
    });
};

export const apiErrorToString = (error: any, short = false) => {
    let errorMsg = "";
    if (error.message) {
        errorMsg += error.message;
    }
    if (error.response) {
        errorMsg += "\n"
        errorMsg += "Status: " + error.response.status;
        if (!short) {
            errorMsg += "\n"
            errorMsg += "Data: " + JSON.stringify(error.response.data, null, 4);
        }
    }
    return errorMsg;
};




