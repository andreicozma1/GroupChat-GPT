import {ApiResponse} from "stores/chatStore";
import {User} from "src/util/users/User";
import {v4 as uuidv4} from "uuid";
import {getRobohashUrl} from "src/util/ImageUtils";

export interface ChatThreadPrefs {
	hiddenUserIds: string[];
	dontShowMessagesHiddenInPrompts: boolean;
	orderedResponses: boolean;
}

export interface ChatThread {
	messageIdMap: { [key: string]: ChatMessage };
	appVersion?: string;
	joinedUserIds: string[];
	prefs: ChatThreadPrefs;
}


export class ChatMessage {
	userId: string;
	userName: string;
	userAvatarUrl: string;
	dateCreated: string | number | Date = new Date()
	id: string = uuidv4()
	loading: boolean;
	followupMsgIds: string[] = []

	shouldDelete = false
	hideInPrompt = false
	textSnippets: string[] = []
	imageUrls: string[] = []
	apiResponse?: ApiResponse

	constructor(
		chatUser: User,
		store: any
	) {
		this.userId = chatUser?.id || "unknown";
		this.userName = chatUser?.name || "Unknown User";
		this.userAvatarUrl = getRobohashUrl(this.userName)
		this.loading = true
		store.getActiveThread.messageIdMap[this.id] = this
	}

	parseApiResponse(apiRequest: ApiResponse) {
		this.apiResponse = apiRequest;
		console.log("ChatMessage.parseApiResponse:", this.apiResponse);

		const textSnippets = apiRequest.data?.choices?.flatMap((c: any) => {
			return c.text.trim();
		});
		if (textSnippets) {
			console.warn("=> text:");
			textSnippets?.forEach((t: string) => console.log(t));
			this.textSnippets = textSnippets;
		}

		const imageUrls = apiRequest.data?.data?.map((d: any) => d.url);
		if (imageUrls) {
			console.warn("=> images:");
			imageUrls?.forEach((i: string) => console.log(i));
			this.imageUrls = imageUrls;
		}

		if (apiRequest.errorMsg) {
			console.error("Error generating response:", apiRequest.errorMsg);
			this.textSnippets.push("[ERROR]" + "\n" + apiRequest.errorMsg)
		}
	}

}

// TODO: Make these configurable in UI in the future
export interface ChatMessageHistoryConfig {

	// only return this many messages, starting from the most recent
	maxMessages?: number;
	// only return messages before this date. If not set, it will be ignored
	maxDate?: string | number | Date;
	// only return messages after this date. If not set, it will be ignored
	minDate?: string | number | Date;
	// don't return messages from these users, unless the message contains keywords in forceShowKeywords
	hiddenUserIds?: string[];
	// always return messages with these keywords,  regardless of whether the message is from a user in hiddenUserIds
	forceShowKeywords?: string[];
	excludeLoading?: boolean;
}