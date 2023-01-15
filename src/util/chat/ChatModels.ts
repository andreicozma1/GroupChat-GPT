import {ChatMessage} from "src/util/chat/ChatMessage";

export interface ChatThreadPrefs {
	hiddenUserIds: string[];
	dontShowMessagesHiddenInPrompts: boolean;
	orderedResponses: boolean;
}

export interface ChatThread {
	id: string;
	name: string;
	messageIdMap: { [key: string]: ChatMessage };
	appVersion?: string;
	joinedUserIds: string[];
	prefs: ChatThreadPrefs;
}


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