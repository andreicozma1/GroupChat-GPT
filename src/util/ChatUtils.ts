import {AiAssistantConfigs} from "src/util/assistant/AiAssistantConfigs";
import {getRoboHashAvatarUrl} from "src/util/ImageUtils";
import {GenerationResult, humanName} from "stores/compStore";
import {AiAssistant} from "src/util/assistant/AiAssistantModels";
import {smartNotify} from "src/util/SmartNotify";

export interface ChatThread {
	messageMap: { [key: string]: ChatMessage };
	orderedKeysList: string[];
	hiddenUserIds?: string[];
	appVersion?: string;
}

export interface ChatMessage extends GenerationResult {
	id: string | undefined;
	avatar: string;
	userId: string;
	name: string;
	textSnippets: string[];
	images: string[];
	dateCreated: string | number | Date;
	loading?: boolean;
	isRegen?: boolean;
}

export interface ChatMessageHistConfig {
	thread: ChatThread;
	includeSelf?: boolean;
	includeActors?: AiAssistant[];
	excludeActors?: AiAssistant[];
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
		if (m.name === humanName) {
			if (config.includeSelf === undefined) return true;
			return config.includeSelf;
		}
		const actor_key = m.userId;
		if (actor_key !== undefined) {
			const actor = AiAssistantConfigs[actor_key];
			if (actor && actor.isHelper === true) return false;
		}
		// handle actors to include and exclude
		if (config.includeActors) {
			return config.includeActors.some((actor) => actor.name === m.name);
		}
		if (config.excludeActors) {
			return !config.excludeActors.some((actor) => actor.name === m.name);
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
	cfg: AiAssistant,
	comp: any
): ChatMessage => {
	const assistantName: string = cfg?.name || "Unknown AI";
	const assistantKey: string = cfg?.key || "unknown";
	let msg: ChatMessage = {
		id: undefined,
		textSnippets: [],
		images: [],
		avatar: getRoboHashAvatarUrl(assistantName),
		name: assistantName,
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
	const cfg: AiAssistant = AiAssistantConfigs[key];
	const msg = createMessageFromConfig(cfg, comp);
	if (!cfg) {
		msg.textSnippets.push(`[Error: Unknown assistant key: ${key}]`);
		msg.loading = false;
		comp.pushMessage(msg);
		return undefined;
	}
	return msg;
};
