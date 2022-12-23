import { Notify } from "quasar"

export const randomMinMax = (min: number, max: number) => Math.random() * (max - min) + min

export const getSeededAvatarURL = (seed: string) => {
	return `https://robohash.org/${seed}`
}

interface ImageOptions {
	width?: number;
	height?: number;
}

export const getSeededImageURL = (seed: string, options?: ImageOptions) => {
	const w = options?.width || Math.round(randomMinMax(100, 800))
	const h = options?.height || Math.round(randomMinMax(100, 800))
	seed = seed.replace(/ /g, "_")
	return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

export const getRandomTextStr = () => {
	const chunks = [
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
		"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
		"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	]
	return chunks[Math.floor(Math.random() * chunks.length)]
}

export const getTimeAgo = (date: string | number | Date) => {
	if (typeof date === "string" || typeof date === "number") {
		date = new Date(date)
	}
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const diffSeconds = Math.floor(diff / 1000)
	const diffMinutes = Math.floor(diffSeconds / 60)
	const diffHours = Math.floor(diffMinutes / 60)
	const diffDays = Math.floor(diffHours / 24)
	const diffWeeks = Math.floor(diffDays / 7)
	const diffMonths = Math.floor(diffDays / 30)
	const diffYears = Math.floor(diffDays / 365)

	const timeAgo = {
		seconds: diffSeconds,
		minutes: diffMinutes,
		hours  : diffHours,
		days   : diffDays,
		weeks  : diffWeeks,
		months : diffMonths,
		years  : diffYears
	}

	// should use plural?
	const shouldUsePlural = (value: number) => value > 1

	// get time ago
	const getTimeAgo = (value: number, unit: string) => {
		return `${value} ${unit}${shouldUsePlural(value) ? "s" : ""} ago`
	}

	// get time ago
	if (timeAgo.years > 0) {
		return getTimeAgo(timeAgo.years, "year")
	} else if (timeAgo.months > 0) {
		return getTimeAgo(timeAgo.months, "month")
	} else if (timeAgo.weeks > 0) {
		return getTimeAgo(timeAgo.weeks, "week")
	} else if (timeAgo.days > 0) {
		return getTimeAgo(timeAgo.days, "day")
	} else if (timeAgo.hours > 0) {
		return getTimeAgo(timeAgo.hours, "hour")
	} else if (timeAgo.minutes > 0) {
		return getTimeAgo(timeAgo.minutes, "minute")
	} else if (timeAgo.seconds > 0) {
		return getTimeAgo(timeAgo.seconds, "second")
	} else {
		return "just now"
	}
}
export const dateToStr = (date: string | number | Date) => {
	if (typeof date === "string" || typeof date === "number") {
		date = new Date(date)
	}
	const options = {
		weekday: "short",
		year   : "numeric",
		month  : "short",
		day    : "numeric",
		hour   : "numeric",
		minute : "numeric",
		hour12 : true
	}
	return date.toLocaleDateString("en-US", options)
}

export const smartNotify = (message: string) => {
	Notify.create({
		message: message,
		timeout: 500
	})
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
