import { AssistantConfigs } from "src/util/assistant/Assistants";
import { AssistantConfig } from "src/util/assistant/AssistantUtils";
import { GenerationResult, humanName } from "stores/compStore";

export interface ChatThread {
	messageMap: { [key: string]: ChatMessage };
	orderedKeysList: string[];
}

export interface ChatMessage extends GenerationResult {
	id?: string;
	avatar: string;
	name: string;
	date: string | number | Date;
	objective?: string;
	dateCreated?: string | number | Date;
	loading?: boolean;
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
		const actor_key = m.objective;
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
