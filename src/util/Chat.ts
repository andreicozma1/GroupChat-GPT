import { AssistantConfig } from "src/util/assistant/Util";
import { humanName } from "stores/compStore";

export interface ChatThread {
	messages: ChatMessage[];
}

export interface ChatMessage {
	id?: string | number;
	text: string[];
	images: string[];
	avatar: string;
	name: string;
	date: string | number | Date;
	objective?: string;
	dateCreated?: string | number | Date;
	cached?: boolean;
	loading?: boolean;
}

export interface ChatMessageHistConfig {
	messages: ChatMessage[];
	includeSelf?: boolean;
	includeActors?: AssistantConfig[];
	excludeActors?: AssistantConfig[];
	maxLength?: number;
}

export const getMessageHistory = (config: ChatMessageHistConfig): ChatMessage[] => {
	let hist = config.messages;
	hist = hist.filter((m) => {
		if (m.name === humanName) {
			if (config.includeSelf === undefined) return true;
			return config.includeSelf;
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
