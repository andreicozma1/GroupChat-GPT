import {PromptResponse} from "stores/compStore";

export interface ChatThread {
	messageIdMap: { [key: string]: ChatMessage };
	appVersion?: string;
	joinedUserIds: string[];
	prefs: {
		hiddenUserIds: string[];
		hideIgnoredMessages: boolean;
		orderedResponses: boolean;
	};
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
	isDeleted?: boolean;
	hideInPrompt?: boolean;
	followupMsgIds: string[];
}

// TODO: Make these configurable in UI in the future
export interface ChatMessageHistoryConfig {
	forceShowKeywords?: string[];
	hiddenUserIds?: string[];
	maxLength?: number; // if 0 or undefined, no limit
	maxDate?: string | number | Date; // if undefined, no limit
}
