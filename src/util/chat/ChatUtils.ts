import {ChatMessage, ChatMessageHistoryConfig, ChatThread} from "src/util/chat/ChatModels";
import {parseDate} from "src/util/DateUtils";


function msgContainsKeywords(message: ChatMessage, keywords: string[]): boolean {
	const text: string = message.textSnippets.join(" ").toLowerCase();
	return keywords.some((keyword: string) => text.includes(keyword.toLowerCase()));
}

export const getMessageHistory = (thread: ChatThread, config: ChatMessageHistoryConfig): ChatMessage[] => {
	const excludeLoading = config.excludeLoading ?? false;
	let messages: ChatMessage[] = Object.values(thread.messageIdMap)
	// filter out messages whose textSnippets stripped and joined are empty
	// unless the message has an image
	messages = messages.filter((message: ChatMessage) => {
		const textSnippets: string = message.textSnippets.map((snippet: string) => snippet.trim()).join("")
		const imageUrls: string = message.imageUrls.map((url: string) => url.trim()).join("")
		if (textSnippets.length === 0 && imageUrls.length === 0 && (!message.loading || excludeLoading)) {
			return false
		}
		return true
	})
	messages.sort((a: ChatMessage, b: ChatMessage) => {
		const ad = parseDate(a.dateCreated).getTime();
		const bd = parseDate(b.dateCreated).getTime();
		return ad - bd;
	});
	console.log("getMessageHistory->original:", messages);
	if (config.maxMessages) {
		messages = messages.slice(-config.maxMessages);
		console.log("getMessageHistory->maxMessages:", messages);
	}
	messages = messages.filter((message: ChatMessage) => {
		if (config.maxDate && config.maxDate < message.dateCreated) return false;
		if (config.minDate && config.minDate > message.dateCreated) return false;
		if (config.forceShowKeywords && msgContainsKeywords(message, config.forceShowKeywords)) return true;
		if (config.hiddenUserIds && config.hiddenUserIds.includes(message.userId)) return false;
		return true;
	})

	console.log("getMessageHistory->filter:", messages);
	return messages;
};


