import {Notify} from "quasar";

export const smartNotify = (message: string, caption?: string) => {
	const msgLen = message.length;
	const capLen = caption ? caption.length : 0;
	let msgTimeout = 500;
	msgTimeout += msgLen * 40 + capLen * 30;

	const typeMap = {
		error: {
			keywords: [
				"error",
				"fail",
				"not found",
				"not compatible",
				"not supported",
			],
			color: "red-12",
			textColor: "white",
		},
		warning: {
			keywords: [
				"warn",
				"not implemented",
				"not yet implemented",
			],
			color: "orange-12",
			textColor: "white",
		},
		info: {
			keywords: ["info", "copied"],
			color: "blue-4",
			textColor: "white",
		},
		success: {
			keywords: ["success", "done"],
			color: "green-4",
			textColor: "white",
		},
	};

	let color = "grey-6";
	let textColor = "white";
	// look for keywords in message to determine type
	// if no keywords found, default to info
	for (const value of Object.values(typeMap)) {
		const keywords = value.keywords;
		const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());
		const lowerMessage = message.toLowerCase();
		if (lowerKeywords.some((keyword) => lowerMessage.includes(keyword))) {
			color = value.color;
			textColor = value.textColor;
			break;
		}
	}

	Notify.create({
		color: color,
		textColor: textColor,
		message: message,
		caption: caption,
		timeout: msgTimeout,
		progress: true,
	});
};
