import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getRobohashUrl} from "src/util/ImageUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
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
		// handle actors to include and exclude
		if (config.includeActors) {
			return config.includeActors.some((actor) => actor.name === m.userName);
		}
		if (config.excludeActors) {
			return !config.excludeActors.some((actor) => actor.name === m.userName);
		}
		return true;
	});
	// const hist_zero_len = hist.filter((m) => m.textSnippets.length === 0);
	// if (hist_zero_len.length > 0) {
	// 	hist = hist.filter((m) => m.textSnippets.length > 0);
	// }
	hist = hist.map((m) => {
		m.textSnippets = m.textSnippets.filter((t: string) => t.trim().length > 0);
		return m;
	});
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength);
	return hist;
};

export const createMessageFromUserCfg = (userCfg: ChatUser, comp: any): ChatMessage => {
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
		followUpsIds: [],
	};
	msg = comp.pushMessage(msg);
	return msg;
};

export const createMessageFromUserId = (id: string, comp: any): ChatMessage => {
	id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
	const cfg: Assistant = AssistantConfigs[id];
	return createMessageFromUserCfg(cfg, comp);
};
