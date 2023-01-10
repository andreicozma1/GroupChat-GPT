import {PromptResponse} from "stores/chatStore";

export interface ChatThreadPrefs {
	hiddenUserIds: string[];
	dontShowMessagesHiddenInPrompts: boolean;
	orderedResponses: boolean;
}

export interface ChatThread {
	messageIdMap: { [key: string]: ChatMessage };
	appVersion?: string;
	joinedUserIds: string[];
	prefs: ChatThreadPrefs;
}

export interface ChatMessage extends PromptResponse {
	id: string;
	// TODO: Put these in a separate User interface
	userId: string;
	userName: string;
	userAvatarUrl: string;

	// TODO: Put dates in ChatMessageDates interface and keep track of edits
	dateCreated: string | number | Date;
	// TODO: Put this in ChatMessageFlags interface
	loading: boolean;
	// TODO: There's probably a better way to do keep track of whether a message is a re-generation
	// TODO: Alternatively, could also keep history of edits (editMessage function)
	isCompRegen?: boolean;
	shouldDelete?: boolean;
	hideInPrompt?: boolean;
	followupMsgIds: string[];
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