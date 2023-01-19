// TODO: Make these configurable in UI in the future
import {Message} from "src/util/chat/Message";

export interface ChatMessageHistoryConfig {
	// only return this many messages, starting from the most recent
	maxMessages?: number;
	// only return messages before this date. If not set, it will be ignored
	maxDate?: string | number | Date;
	// only return messages after this date. If not set, it will be ignored
	minDate?: string | number | Date;
	// don't return messages from these users, unless the message contains keywords in forceShowKeywords
	excludeUserIds?: string[];
	// always return messages with these keywords,  regardless of whether the message is from a user in hiddenUserIds
	forceShowKeywords?: string[];
	excludeLoading?: boolean;
	excludeNoText?: boolean;
	excludeIgnored?: boolean;
}

export const parseMessagesHistory = (
	messages: Message[],
	config: ChatMessageHistoryConfig
): Message[] => {
	const excludeLoading = config.excludeLoading ?? false;
	const excludeNoText = config.excludeNoText ?? false;
	const excludeIgnored = config.excludeIgnored ?? false;
	// filter out messages whose textSnippets stripped and joined are empty
	// unless the message has an image
	messages = messages.filter((message: Message) => {
		if (excludeLoading && message.loading) return false;
		if (excludeIgnored && message.isIgnored) return false;
		if (excludeNoText && !message.hasTextSnippets()) return false;
		return true;
	});
	// console.log("getMessageHistory->original:", messages);
	if (config.maxMessages) {
		messages = messages.slice(-config.maxMessages);
		// console.log("getMessageHistory->maxMessages:", messages);
	}
	messages = messages.filter((message: Message) => {
		if (config.maxDate && config.maxDate < message.dateCreated) return false;
		if (config.minDate && config.minDate > message.dateCreated) return false;
		if (config.forceShowKeywords &&
			message.containsKeywords(config.forceShowKeywords)) {
			return true;
		}
		if (config.excludeUserIds &&
			config.excludeUserIds.includes(message.userId)) {
			return false;
		}
		return true;
	});

	// console.log("getMessageHistory->filter:", messages);
	return messages;
};
