// return process.env.npm_package_version || "unknown";
import {version} from "./../../package.json";
import {copyToClipboard} from "quasar";
import {smartNotify} from "src/util/SmartNotify";

export const getAppVersion = () => {
	return version.trim();
};

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

export const rHtmlTagStart = /<[a-zA-Z0-9_]+>/gi;
export const rHtmlTagEnd = /<\/[a-zA-Z0-9_]+>/gi;
export const rHtmlTagWithContent = /<[a-zA-Z0-9_]+>(.+?)<\/[a-zA-Z0-9_]+>/gis;

export const createRegexHtmlTagWithContent = (tag: string) => {
	return new RegExp(`<${tag}>(.+?)</${tag}>`, "gis");
};

export const createRegexHtmlTagStart = (tag: string) => {
	return new RegExp(`<${tag}>`, "gi");
};

export const createRegexHtmlTagEnd = (tag: string) => {
	return new RegExp(`</${tag}>`, "gi");
};
