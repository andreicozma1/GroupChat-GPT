import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getRobohashUrl} from "src/util/ImageUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {smartNotify} from "src/util/SmartNotify";
import {v4 as uuidv4} from "uuid";
import {ChatMessage, ChatMessageHistConfig, ChatThread, ChatUser,} from "src/util/chat/ChatModels";
import {ConfigUserBase} from "src/util/chat/ConfigUserBase";

export const getThreadMessages = (thread: ChatThread): ChatMessage[] => {
	return thread.orderedKeysList.map((key) => thread.messageMap[key]);
};

export const getMessageHistory = (
	config: ChatMessageHistConfig
): ChatMessage[] => {
	let hist = getThreadMessages(config.thread);
	hist = hist.filter((m: ChatMessage) => {
		if (m.userId === ConfigUserBase.id) {
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
		smartNotify(
			`Warning: ${hist_zero_len.length} messages have 0 text snippets`
		);
		hist = hist.filter((m) => m.textSnippets.length > 0);
		// TODO: Also remove and warn about messages that have any snippet with 0 length
	}
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength);
	return hist;
};

export const buildMessage = (userCfg: ChatUser, comp: any): ChatMessage => {
	const assistantName: string = userCfg?.name || "Unknown User";
	const assistantKey: string = userCfg?.id || "unknown";
	let msg: ChatMessage = {
		id: uuidv4(),
		userId: assistantKey,
		userName: assistantName,
		userAvatarUrl: getRobohashUrl(assistantName),
		textSnippets: [],
		imageUrls: [],
		dateCreated: new Date(),
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
	const msg = buildMessage(cfg, comp);
	if (!cfg) {
		msg.textSnippets.push(`[Error: Unknown assistant key: ${key}]`);
		msg.loading = false;
		comp.pushMessage(msg);
		return undefined;
	}
	return msg;
};
