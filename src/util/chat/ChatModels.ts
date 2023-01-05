import {Assistant} from "src/util/assistant/AssistantModels";
import {GenerationResult} from "stores/compStore";

export interface ChatUser {
	id: string;
	name: string;
	icon: string;
}

export interface ChatThread {
	messageMap: { [key: string]: ChatMessage };
	orderedKeysList: string[];
	appVersion?: string;
	joinedUserIds: string[];
	prefs: {
		shownUsers: { [key: string]: boolean };
		showDeletedMessages: boolean;
		orderedResponses: boolean;
	}
}

export interface ChatMessage extends GenerationResult {
	id: string;
	// TODO: Put these in a separate User interface
	userId: string;
	userName: string;
	userAvatarUrl: string;

	// TODO: Put dates in ChatMessageDates interface and keep track of edits
	dateCreated: string | number | Date;
	// TODO: Put this in ChatMessageFlags interface
	loading?: boolean;
	// TODO: There's probably a better way to do keep track of whether a message is a re-generation
	// TODO: Alternatively, could also keep history of edits (editMessage function)
	isCompRegen?: boolean;
	isDeleted?: boolean;
}

// TODO: Make these configurable in UI in the future
export interface ChatMessageHistConfig {
	thread: ChatThread;
	includeSelf?: boolean;
	includeActors?: Assistant[];
	excludeActors?: Assistant[];
	maxLength?: number;
}