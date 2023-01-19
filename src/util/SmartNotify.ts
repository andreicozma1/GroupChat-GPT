import {Notify, QNotifyCreateOptions} from "quasar";
import {sleepPromise} from "src/util/Utils";

const notifyQueue: QNotifyCreateOptions[] = [];
let notifyTimeout: any = undefined;

export const smartNotify = (message: string, caption?: string) => {
	const msgLen = message.length;
	const capLen = caption ? caption.length : 0;
	let msgTimeout = 500;
	msgTimeout += msgLen * 50 + capLen * 30;

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
			keywords: ["warn", "not implemented", "not yet implemented"],
			color: "orange-12",
			textColor: "white",
		},
		info: {
			keywords: ["info", "copied", "registering", "loading"],
			color: "blue-4",
			textColor: "white",
		},
		success: {
			keywords: ["success", "done", "registered", "loaded"],
			color: "green-4",
			textColor: "white",
		},
	};

	let color = "grey-6";
	let textColor = "white";
	// look for keywords in message to determine type
	// if no keywords found, default to info

	// create an array of each word in the message as well as phrases of 2 words
	const msgWords = message
		.toLowerCase()
		.split(" ")
		.map((w) => w.trim());
	const msgMatches = new Set<string>();
	for (let i = 0; i < msgWords.length - 1; i++) {
		msgMatches.add(msgWords[i]);
		msgMatches.add(msgWords[i + 1]);
		msgMatches.add(msgWords[i] + " " + msgWords[i + 1]);
	}

	let found = false;
	for (const msgMatch of msgMatches) {
		for (const value of Object.values(typeMap)) {
			const matchKeywords = value.keywords;
			const lowerKeywords = matchKeywords.map((keyword) =>
				keyword.toLowerCase()
			);
			// split by space for each word and also every 2 words

			if (lowerKeywords.some((keyword) => msgMatch.includes(keyword))) {
				color = value.color;
				textColor = value.textColor;
				found = true;
				break;
			}
		}
		if (found) break;
	}

	console.warn("smartNotify->message:", message);
	if (caption) console.log("smartNotify->caption:", caption);

	notifyQueue.push({
		color: color,
		textColor: textColor,
		message: message,
		caption: caption,
		timeout: msgTimeout,
		progress: true,
	});

	if (notifyTimeout) {
		clearTimeout(notifyTimeout);
		notifyTimeout = undefined;
	}
	notifyTimeout = setTimeout(async () => {
		while (notifyQueue.length > 0) {
			const opts: QNotifyCreateOptions | undefined = notifyQueue.shift();
			if (!opts) continue;
			Notify.create(opts);
			await sleepPromise(1000);
		}
	}, 250);
};
