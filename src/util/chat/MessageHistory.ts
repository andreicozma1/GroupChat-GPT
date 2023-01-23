// TODO: Make these configurable in UI in the future
import {Message} from "src/util/chat/Message";
import {parseDate} from "src/util/DateUtils";

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
		if (excludeLoading && message.loading) {
			return false;
		}
		if (excludeIgnored && message.isIgnored) {
			return false;
		}
		if (excludeNoText && !message.hasTextSnippets()) {
			return false;
		}
		return true;
	});
	// console.log("getMessageHistory->original:", messages);

	messages = messages.filter((message: Message) => {
		if (config.maxDate) {
			console.error(parseDate(config.maxDate));
			console.error(parseDate(message.dateCreated));
			console.error(config.maxDate && parseDate(config.maxDate) <= parseDate(message.dateCreated));
			console.error(config.minDate && parseDate(config.minDate) >= parseDate(message.dateCreated));
		}
		if (config.maxDate && parseDate(config.maxDate) < parseDate(message.dateCreated)) {
			return false;
		}
		if (config.minDate && parseDate(config.minDate) > parseDate(message.dateCreated)) {
			return false;
		}
		if (
			config.forceShowKeywords &&
			message.containsKeywords(config.forceShowKeywords)
		) {
			return true;
		}
		if (
			config.excludeUserIds &&
			config.excludeUserIds.includes(message.userId)
		) {
			return false;
		}
		return true;
	});

	if (config.maxMessages) {
		messages = messages.slice(-config.maxMessages);
		// console.log("getMessageHistory->maxMessages:", messages);
	}
	// console.log("getMessageHistory->filter:", messages);
	return messages;
};
