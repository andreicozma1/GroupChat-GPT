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

export const validTagPattern = '[a-zA-Z0-9_]+'

export const getStrHtmlTagStart = (tag = validTagPattern) => {
	return `<(${tag})>\\s*`
};

export const getStrHtmlTagEnd = (tag = validTagPattern) => {
	return `\\s*</?(${tag})>`
};

export const getStrHtmlTagWithContent = (tag = validTagPattern) => {
	const content = '(.+?)';
	return `${getStrHtmlTagStart(tag)}${content}${getStrHtmlTagEnd(tag)}`
};

export const createRegexHtmlTagWithContent = (tag = validTagPattern) => {
	return new RegExp(getStrHtmlTagWithContent(tag), 'gis');
};

export const createRegexHtmlTagStart = (tag = validTagPattern) => {
	return new RegExp(getStrHtmlTagStart(tag), 'gis');
};

export const createRegexHtmlTagEnd = (tag = validTagPattern) => {
	return new RegExp(getStrHtmlTagEnd(tag), 'gis');
};




