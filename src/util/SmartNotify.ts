import {Notify} from "quasar";

export const smartNotify = (message: string, caption?: string) => {
	const msgLen = message.length;
	const capLen = caption ? caption.length : 0;
	let msgTimeout = 500;
	msgTimeout += msgLen * 40 + capLen * 30;

	const typeMap = {
		error: {
			type: "negative",
			keywords: [
				"error",
				"fail",
				"not found",
				"not compatible",
				"not supported",
			],
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
