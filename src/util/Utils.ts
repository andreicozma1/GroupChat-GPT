// return process.env.npm_package_version || "unknown";
import {version} from "./../../package.json";

export const getAppVersion = () => {
	return version.trim();
};
export const getRandomMinMax = (min: number, max: number) =>
	Math.random() * (max - min) + min;

export const parseNounCount = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
