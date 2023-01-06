import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getRobohashUrl} from "src/util/ImageUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {v4 as uuidv4} from "uuid";
import {ChatMessage, ChatMessageHistConfig, ChatThread, ChatUser,} from "src/util/chat/ChatModels";
import {ConfigUserBase} from "src/util/chat/ConfigUserBase";
import {parseDate} from "src/util/DateUtils";

export const getThreadMessages = (thread: ChatThread): ChatMessage[] => {
	let messages = thread.orderedKeysList.map((key) => thread.messageMap[key]);

	const hasKeepKeywords = (msg: ChatMessage) => {
		const keywords = ["[ERROR]", "[WARNING]", "[INFO]"];
		return msg.textSnippets.some((line: string) => {
			return keywords.some((keyword: string) => line.includes(keyword));
		});
	}

	const hasRemoveKeywords = (msg: ChatMessage) => {
		const keywords = ["[DEBUG]"];
		return msg.textSnippets.some((line: string) => {
			return keywords.some((keyword: string) => line.includes(keyword));
		});
	}

	/************************************************************************
	 ** FILTERING
	 ************************************************************************/
	messages = messages.filter((msg: ChatMessage) => {
		if (msg.isIgnored) return false;
		// always keep messages with certain keywords
		if (hasKeepKeywords(msg)) return true;
		// always remove messages with certain keywords
		if (hasRemoveKeywords(msg)) return false;
		return true;
	});
	/************************************************************************
	 ** SORTING
	 ************************************************************************/
	// sort by dateCreated
	messages.sort((a, b) => {
		const ad = parseDate(a.dateCreated);
		const bd = parseDate(b.dateCreated);
		return ad.getTime() - bd.getTime();
	});
	messages.sort((a, b) => {
		// if isCompRegen is true, keep the same order
		// if (a.isCompRegen || b.isCompRegen) return 0;
		// otherwise, keep loading messages at the bottom
		if (a.loading && !b.loading) return 1;
		if (!a.loading && b.loading) return -1;
		return 0;
	});
	return messages;
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
	hist = hist.filter((m: ChatMessage) => !m.loading);
	hist = hist.filter((m) => m.textSnippets.length > 0);
	// hist = hist.map((m) => {
	// 	m.textSnippets = m.textSnippets.filter((t: string) => t.trim().length > 0);
	// 	return m;
	// });
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
