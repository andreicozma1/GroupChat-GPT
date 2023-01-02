import { AssistantConfigs } from "src/util/assistant/Assistants";
import { AssistantConfig } from "src/util/assistant/AssistantUtils";
import { getRoboHashAvatarUrl } from "src/util/Utils";
import { GenerationResult, humanName } from "stores/compStore";

export interface ChatThread {
	messageMap: { [key: string]: ChatMessage };
	orderedKeysList: string[];
}

export interface ChatMessage extends GenerationResult {
	id: string | undefined;
	avatar: string;
	assistantKey: string;
	name: string;
	text: string[];
	images: string[];
	dateCreated: string | number | Date;
	loading?: boolean;
	isRegen?: boolean;
}

export interface ChatMessageHistConfig {
	thread: ChatThread;
	includeSelf?: boolean;
	includeActors?: AssistantConfig[];
	excludeActors?: AssistantConfig[];
	maxLength?: number;
}

export const getThreadMessages = (thread: ChatThread): ChatMessage[] => {
	return thread.orderedKeysList.map((key) => thread.messageMap[key]);
};

export const getMessageHistory = (config: ChatMessageHistConfig): ChatMessage[] => {
	// const thread = config.thread;
	// let hist = thread.messages.map((id) => thread.messageMap[id]);
	let hist = getThreadMessages(config.thread);
	hist = hist.filter((m) => {
		if (m.name === humanName) {
			if (config.includeSelf === undefined) return true;
			return config.includeSelf;
		}
		const actor_key = m.assistantKey;
		if (actor_key !== undefined) {
			const actor = AssistantConfigs[actor_key];
			if (actor && actor.helper === true) return false;
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
	hist = hist.filter((m) => m.text.length > 0);
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength);
	return hist;
};
export const createMessageFromConfig = (cfg: AssistantConfig, comp: any): ChatMessage => {
	const assistantName: string = cfg?.name || "Unknown AI";
	const assistantKey: string = cfg?.key || "unknown";
	let msg: ChatMessage = {
		id: undefined,
		text: [],
		images: [],
		avatar: getRoboHashAvatarUrl(assistantName),
		name: assistantName,
		dateCreated: new Date(),
		assistantKey: assistantKey,
		loading: true,
	};
	msg = comp.pushMessage(msg);
	return msg;
};
export const createMessageFromAiKey = (key: string, comp: any): ChatMessage => {
	key = key.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
	const cfg: AssistantConfig = AssistantConfigs[key];
	const msg = createMessageFromConfig(cfg, comp);
	if (!cfg) {
		msg.text.push(`[Error: Unknown assistant key: ${key}]`);
		msg.loading = false;
		comp.pushMessage(msg);
	}
	return msg;
};
