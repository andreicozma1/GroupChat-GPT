import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getRobohashUrl} from "src/util/ImageUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {v4 as uuidv4} from "uuid";
import {ChatMessage, ChatMessageHistoryConfig, ChatThread, ChatUser,} from "src/util/chat/ChatModels";
import {ConfigUserBase} from "src/util/chat/ConfigUserBase";
import {parseDate} from "src/util/DateUtils";

export const getThreadMessages = (thread: ChatThread): ChatMessage[] => {
	let messages = Object.values(thread.messageIdMap)

	const shouldForceShow = (message: ChatMessage) => {
		const keywords = ["[ERROR]", "[WARNING]", "[INFO]"];
		return message.textSnippets.some((snippet: string) => {
			return keywords.some((keyword: string) => snippet.includes(keyword));
		});
	}

	messages = messages.map((message: ChatMessage) => {
		// always keep messages with certain keywords
		if (shouldForceShow(message)) {
			message.forceShow = true;
		}
		return message;
	})

	messages = messages.filter((msg: ChatMessage) => {
		if (msg.forceShow) {
			return true;
		}
		return true;
	});

	// sort by dateCreated
	messages.sort((a, b) => {
		const ad = parseDate(a.dateCreated).getTime();
		const bd = parseDate(b.dateCreated).getTime();
		return ad - bd;
	});
	return messages;
};

export const getMessageHistory = (
	config: ChatMessageHistoryConfig
): ChatMessage[] => {
	let history = getThreadMessages(config.thread);
	history = history.filter((m: ChatMessage) => {
		if (config.maxDate < m.dateCreated) return false;

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
	history = history.filter((m) => m.textSnippets.length > 0);

	if (config.maxLength !== undefined) history = history.slice(-config.maxLength);
	return history;
};

export const createMessageFromUserConfig = (chatUser: ChatUser, store: any): ChatMessage => {
	const assistantName: string = chatUser?.name || "Unknown User";
	const assistantKey: string = chatUser?.id || "unknown";
	let msg: ChatMessage = {
		id: uuidv4(),
		userId: assistantKey,
		userName: assistantName,
		userAvatarUrl: getRobohashUrl(assistantName),
		textSnippets: [],
		imageUrls: [],
		dateCreated: new Date(),
		loading: true,
		followupMsgIds: [],
	};
	msg = store.pushMessage(msg);
	return msg;
};

export const createMessageFromUserId = (id: string, store: any): ChatMessage => {
	id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
	const cfg: Assistant = AssistantConfigs[id];
	return createMessageFromUserConfig(cfg, store);
};
