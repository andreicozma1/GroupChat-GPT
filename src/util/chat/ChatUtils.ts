import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getRobohashUrl} from "src/util/ImageUtils";
import {GenerationResult, humanName} from "stores/compStore";
import {Assistant} from "src/util/assistant/AssistantModels";
import {smartNotify} from "src/util/SmartNotify";

export interface ChatThread {
	messageMap: { [key: string]: ChatMessage };
	orderedKeysList: string[];
	hiddenUserIds?: string[];
	appVersion?: string;
}

export interface ChatMessage extends GenerationResult {
	id: string | undefined;
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
}

// TODO: Make these configurable in UI in the future
export interface ChatMessageHistConfig {
	thread: ChatThread;
	includeSelf?: boolean;
	includeActors?: Assistant[];
	excludeActors?: Assistant[];
	maxLength?: number;
}

export const getThreadMessages = (thread: ChatThread): ChatMessage[] => {
	return thread.orderedKeysList.map((key) => thread.messageMap[key]);
};

export const getMessageHistory = (
	config: ChatMessageHistConfig
): ChatMessage[] => {
	let hist = getThreadMessages(config.thread);
	hist = hist.filter((m) => {
		if (m.userName === humanName) {
			if (config.includeSelf === undefined) return true;
			return config.includeSelf;
		}
		const actor_key = m.userId;
		if (actor_key !== undefined) {
			const actor = AssistantConfigs[actor_key];
			if (actor && actor.isHelper === true) return false;
		}
		// handle actors to include and exclude
		if (config.includeActors) {
			return config.includeActors.some((actor) => actor.name === m.userName);
		}
		if (config.excludeActors) {
			return !config.excludeActors.some((actor) => actor.name === m.userName);
		}
		return true;
	});
	const hist_zero_len = hist.filter((m) => m.textSnippets.length === 0);
	if (hist_zero_len.length > 0) {
		smartNotify(`Warning: ${hist_zero_len.length} messages have 0 text snippets`);
		hist = hist.filter((m) => m.textSnippets.length > 0);
		// TODO: Also remove and warn about messages that have any snippet with 0 length
	}
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength);
	return hist;
};
export const createMessageFromConfig = (
	cfg: Assistant,
	comp: any
): ChatMessage => {
	const assistantName: string = cfg?.name || "Unknown AI";
	const assistantKey: string = cfg?.key || "unknown";
	let msg: ChatMessage = {
		id: undefined,
		textSnippets: [],
		imageUrls: [],
		userAvatarUrl: getRobohashUrl(assistantName),
		userName: assistantName,
		dateCreated: new Date(),
		userId: assistantKey,
		loading: true,
	};
	msg = comp.pushMessage(msg);
	return msg;
};

// TODO: better handling for undefined case
export const createMessageFromAiKey = (
	key: string,
	comp: any
): ChatMessage | undefined => {
	key = key.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
	const cfg: Assistant = AssistantConfigs[key];
	const msg = createMessageFromConfig(cfg, comp);
	if (!cfg) {
		msg.textSnippets.push(`[Error: Unknown assistant key: ${key}]`);
		msg.loading = false;
		comp.pushMessage(msg);
		return undefined;
	}
	return msg;
};
