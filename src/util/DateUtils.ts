import {getSingularOrPlural} from "src/util/TextUtils";

export type ValidDateTypes = Date | string | number;

export const parseDate = (dateRepr: ValidDateTypes): Date => {
	if (typeof dateRepr === "string" || typeof dateRepr === "number")
		dateRepr = new Date(dateRepr);
	return dateRepr;
};

export const dateToLocaleStr = (date: ValidDateTypes) => {
	date = parseDate(date);
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	};
	return date?.toLocaleDateString("en-US", options);
};

export const dateToTimeAgo = (date: ValidDateTypes) => {
	date = parseDate(date);
	const dateNow = new Date();
	const diff = dateNow?.getTime() - date?.getTime();

	// Calculate the differences for each time unit
	const dSec = Math.floor(diff / 1000);
	const dMin = Math.floor(dSec / 60);
	const dHour = Math.floor(dMin / 60);
	const dDay = Math.floor(dHour / 24);
	const dWeek = Math.floor(dDay / 7);
	const dMonth = Math.floor(dDay / 30);
	const dYear = Math.floor(dDay / 365);

	const timeAgo = {
		year: dYear,
		month: dMonth,
		week: dWeek,
		day: dDay,
		hour: dHour,
		minute: dMin,
		second: dSec,
	};

	// Helper for the final string
	const parseTimeAgoStr = (unit: string, value: number) => {
		const noun = getSingularOrPlural(unit, value);
		return `${value} ${noun} ago`;
	};

	// Get the first unit that is greater than 0
	for (const [key, value] of Object.entries(timeAgo)) {
		if (value > 0) return parseTimeAgoStr(key, value);
	}
	// If we get here, it's been less than a second
	return "just now";
};
