import {parseDate} from "src/util/DateUtils";
import {ChatMessage} from "src/util/chat/ChatMessage";

// TODO: Make these configurable in UI in the future
export interface ChatMessageHistoryConfig {
	// only return this many messages, starting from the most recent
	maxMessages?: number;
	// only return messages before this date. If not set, it will be ignored
	maxDate?: string | number | Date;
	// only return messages after this date. If not set, it will be ignored
	minDate?: string | number | Date;
	// don't return messages from these users, unless the message contains keywords in forceShowKeywords
	hiddenUserIds?: string[];
	// always return messages with these keywords,  regardless of whether the message is from a user in hiddenUserIds
	forceShowKeywords?: string[];
	excludeLoading?: boolean;
}

export const parseMessageHistory = (
	messages: ChatMessage[],
	config: ChatMessageHistoryConfig
): ChatMessage[] => {
	const excludeLoading = config.excludeLoading ?? false;
	// filter out messages whose textSnippets stripped and joined are empty
	// unless the message has an image
	messages = messages.filter((message: ChatMessage) => {
		const textSnippets: string = message.textSnippets
			.map((snippet: string) => snippet.trim())
			.join("");
		const imageUrls: string = message.imageUrls
			.map((url: string) => url.trim())
			.join("");
		if (
			textSnippets.length === 0 &&
			imageUrls.length === 0 &&
			(!message.loading || excludeLoading)
		) {
			return false;
		}
		return true;
	});
	messages.sort((a: ChatMessage, b: ChatMessage) => {
		const ad = parseDate(a.dateCreated).getTime();
		const bd = parseDate(b.dateCreated).getTime();
		return ad - bd;
	});
	console.log("getMessageHistory->original:", messages);
	if (config.maxMessages) {
		messages = messages.slice(-config.maxMessages);
		console.log("getMessageHistory->maxMessages:", messages);
	}
	messages = messages.filter((message: ChatMessage) => {
		if (config.maxDate && config.maxDate < message.dateCreated) return false;
		if (config.minDate && config.minDate > message.dateCreated) return false;
		if (config.forceShowKeywords &&
			message.containsKeywords(config.forceShowKeywords)) {
			return true;
		}
		if (config.hiddenUserIds &&
			config.hiddenUserIds.includes(message.userId)) {
			return false;
		}
		return true;
	});

	console.log("getMessageHistory->filter:", messages);
	return messages;
};
