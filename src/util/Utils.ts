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

export const createRegexHtmlTagWithContent = (tag = '([a-zA-Z0-9_]+)') => {
	return new RegExp(`<${tag}>\\s*(.+?)\\s*</?${tag}>`, "gis");
};

export const createRegexHtmlTagStart = (tag = '([a-zA-Z0-9_]+)') => {
	return new RegExp(`<${tag}>`, "gi");
};

export const createRegexHtmlTagEnd = (tag = '([a-zA-Z0-9_]+)') => {
	return new RegExp(`</?${tag}>`, "gi");
};
