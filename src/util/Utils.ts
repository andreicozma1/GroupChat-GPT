import { Notify } from "quasar";
import { AssistantConfigs } from "src/util/assistant/Assistants";
import { AssistantConfig } from "src/util/assistant/AssistantUtils";
import { ChatMessage, createMessageFromAiKey, createMessageFromConfig } from "src/util/ChatUtils";

// return process.env.npm_package_version || "unknown";
import { version } from "./../../package.json";

export const getAppVersion = () => {
	return version;
};
export const getRandomMinMax = (min: number, max: number) => Math.random() * (max - min) + min;

export const parseNounCount = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};

export const getTimeAgo = (dateThen: string | number | Date) => {
	dateThen = convertDate(dateThen);
	const dateNow = new Date();
	const diff = dateNow.getTime() - dateThen.getTime();

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
		const noun = parseNounCount(unit, value);
		return `${value} ${noun} ago`;
	};

	// Get the first unit that is greater than 0
	for (const [key, value] of Object.entries(timeAgo)) {
		if (value > 0) return parseTimeAgoStr(key, value);
	}
	// If we get here, it's been less than a second
	return "just now";
};

export const dateToStr = (date: string | number | Date) => {
	date = convertDate(date);
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	};
	return date.toLocaleDateString("en-US", options);
};

export const convertDate = (date: string | number | Date): Date => {
	if (typeof date === "string" || typeof date === "number") {
		date = new Date(date);
	}
	return date;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const smartNotify = (message: string, caption?: string) => {
	const msgLen = message.length;
	let msgTimeout = 500;
	msgTimeout += msgLen * 35;

	const typeMap = {
		error: {
			type: "negative",
			keywords: ["error", "fail", "not found", "not compatible", "not supported"],
		},
		warning: {
			type: "warning",
			keywords: ["warn"],
		},
		info: {
			type: "info",
			keywords: ["info"],
		},
		success: {
			type: "positive",
			keywords: ["success", "done"],
		},
	};

	let type = "info";
	// look for keywords in message to determine type
	// if no keywords found, default to info
	for (const value of Object.values(typeMap)) {
		const keywords = value.keywords;
		const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());
		const lowerMessage = message.toLowerCase();
		if (lowerKeywords.some((keyword) => lowerMessage.includes(keyword))) {
			type = value.type;
			break;
		}
	}

	Notify.create({
		type: type,
		message: message,
		caption: caption || "",
		timeout: msgTimeout,
		progress: true,
		closeBtn: "x",
	});
};

export const handleAssistant = async (msg: ChatMessage, comp: any) => {
	const cfg = AssistantConfigs[msg.userId];
	msg.isRegen = msg.result?.messageIds ? msg.result.messageIds.length > 0 : false;
	if (msg.isRegen) {
		console.warn("=> Regen");
		msg.text = [];
		msg.images = [];
	}

	const res = await comp.generate(cfg, msg.result?.messageIds);
	console.log(res);
	msg.cached = res.cached;
	msg.result = res.result;
	msg.loading = false;

	if (res.errorMsg) {
		msg.text.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(msg);
		return;
	}

	if (res?.images) msg.images.push(...res.images);
	if (res?.text) msg.text.push(...res.text);

	// const totalLength = msg.text.reduce((a, b) => a + b.length, 0) + msg.images.reduce((a, b) => a + b.length, 0)
	// const sleepTime = totalLength * 25
	// console.log(`sleepTime: ${sleepTime}`)
	// await sleep(sleepTime)

	comp.pushMessage(msg);

	const requiredFollowUps = cfg?.followUps ? cfg.followUps : false;
	// if null or undefined, exit
	if (!requiredFollowUps) {
		console.warn("=> No follow-ups");
		return;
	}
	// if string, make it an array
	// for each
	// filter out texts that contain <prompt> tags
	let prompts = msg.text
		.filter((t: string) => t.includes("<prompt>"))
		.map((t: string) => t.split("<prompt>")[1].trim().split("</prompt>")[0].trim());

	msg.text = msg.text.map((t: string) => {
		if (t.includes("<prompt>")) {
			const parts = t.split("<prompt>");
			const end = parts[1].split("</prompt>");
			return parts[0] + end[1];
		}
		return t.trim();
	});
	msg.text = msg.text.filter((t: string) => t.length > 0);
	// msg.text = msg.text.map((t: string) => t.replace("<prompt>", "").replace("</prompt>", ""))
	comp.pushMessage(msg);

	prompts = prompts.filter((t: string) => t.split(" ").length > 3);
	if (prompts.length > 0) {
		console.log("promptText", prompts);
		const nextKey = `${msg.userId}_gen`;
		for (let i = 0; i < prompts.length; i++) {
			const prompt = prompts[i];
			const nextMsg: ChatMessage = createMessageFromAiKey(nextKey, comp);
			if (!nextMsg) return;
			nextMsg.text.push(`<prompt>${prompt}</prompt>`);
			comp.pushMessage(nextMsg);
			await handleAssistant(nextMsg, comp);
		}
	}
};
export const handleCoordinator = async (comp: any, orderedResponses?: boolean) => {
	orderedResponses = orderedResponses === undefined ? true : orderedResponses;
	const coordConf: AssistantConfig = AssistantConfigs.coordinator;
	const coordMsg: ChatMessage = createMessageFromConfig(coordConf, comp);

	const res = await comp.generate(coordConf);

	console.log(res);
	coordMsg.cached = res.cached;
	coordMsg.result = res.result;
	coordMsg.loading = false;

	if (res.errorMsg) {
		coordMsg.text.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(coordMsg);
		return;
	}
	if (!res.text) {
		coordMsg.text.push("Error: No text in result]");
		comp.pushMessage(coordMsg);
		return;
	}
	coordMsg.text = res.text ? [...res.text] : ["An error occurred"];
	comp.pushMessage(coordMsg);
	const nextActors = res.text
		.flatMap((t: string) => t.toLowerCase().split("\n"))
		.filter((t: string) => t.includes("respond"))
		.flatMap((t: string) => t.split(":")[1].split(","))
		.map((a: string) => a.trim().toLowerCase());

	// for each actor, call the appropriate handler
	console.log("Next Actors: ", nextActors);
	for (const nextKey of nextActors) {
		// nextKey = nextKey.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
		// const nextCfg: AssistantConfig = AssistantConfigs[nextKey];
		// const nextMsg = createMessageFromConfig(nextCfg, comp);
		// if (!nextCfg) {
		// 	nextMsg.text.push(`[Error: Unknown assistant key: ${nextKey}]`);
		// 	nextMsg.loading = false;
		// 	comp.pushMessage(nextMsg);
		// 	return;
		// }
		const nextMsg: ChatMessage = createMessageFromAiKey(nextKey, comp);
		if (!nextMsg) return;
		if (orderedResponses) {
			await handleAssistant(nextMsg, comp);
		} else {
			handleAssistant(nextMsg, comp);
		}
	}
};
