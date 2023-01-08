import {getRobohashUrl} from "src/util/ImageUtils";
import {ChatUser} from "src/util/assistant/AssistantModels";
import {v4 as uuidv4} from "uuid";
import {ChatMessage, ChatMessageHistoryConfig} from "src/util/chat/ChatModels";
import {parseDate} from "src/util/DateUtils";


export const getMessageHistory = (comp: any, config: ChatMessageHistoryConfig): ChatMessage[] => {
	let history: ChatMessage[] = Object.values(comp.getThread.messageIdMap)

	if (config.maxLength) history = history.slice(-config.maxLength);
	history = history.filter((message: ChatMessage) => {
		return !(config.maxDate && config.maxDate < message.dateCreated);
	})

	// use config.forceShowKeywords and config.hiddenUserIds
	history = history.filter((message: ChatMessage) => {
		if (config.hiddenUserIds && config.hiddenUserIds.includes(message.userId)) return false;
		if (config.forceShowKeywords && config.forceShowKeywords.length > 0) {
			const text = message.textSnippets.join(" ").toLowerCase();
			return config.forceShowKeywords.some((keyword) => text.includes(keyword.toLowerCase()));
		}
		return true;
	})

	history.sort((a: ChatMessage, b: ChatMessage) => {
		const ad = parseDate(a.dateCreated).getTime();
		const bd = parseDate(b.dateCreated).getTime();
		return ad - bd;
	});
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


