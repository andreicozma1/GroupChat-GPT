import {getRobohashUrl} from "src/util/ImageUtils";
import {ChatUser} from "src/util/assistant/AssistantModels";
import {v4 as uuidv4} from "uuid";
import {ChatMessage, ChatMessageHistoryConfig} from "src/util/chat/ChatModels";
import {parseDate} from "src/util/DateUtils";


function msgContainsKeywords(message: ChatMessage, keywords: string[]): boolean {
	const text: string = message.textSnippets.join(" ").toLowerCase();
	return keywords.some((keyword: string) => text.includes(keyword.toLowerCase()));
}

export const getMessageHistory = (comp: any, config: ChatMessageHistoryConfig): ChatMessage[] => {
	let history: ChatMessage[] = Object.values(comp.getThread.messageIdMap)
	console.log("getMessageHistory->original:", history);

	history = history.filter((message: ChatMessage) => {
		return !(config.maxDate && config.maxDate < message.dateCreated);
	})
	console.log("getMessageHistory->maxDate:", history);

	// use config.forceShowKeywords and config.hiddenUserIds
	history = history.filter((message: ChatMessage) => {
		if (config.hiddenUserIds && config.hiddenUserIds.includes(message.userId)) {
			console.log("getMessageHistory->hiddenUserIds:", message);
			return false;
		}
		if (config.forceShowKeywords && msgContainsKeywords(message, config.forceShowKeywords)) {
			console.log("getMessageHistory->forceShowKeywords", message);
			return true;
		}
		return true;
	})
	console.log("getMessageHistory->filter:", history);

	history.sort((a: ChatMessage, b: ChatMessage) => {
		const ad = parseDate(a.dateCreated).getTime();
		const bd = parseDate(b.dateCreated).getTime();
		return ad - bd;
	});
	console.log("getMessageHistory->sort:", history);

	if (config.maxLength) {
		history = history.slice(-config.maxLength);
		console.log("getMessageHistory->maxLength:", history);
	}
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


