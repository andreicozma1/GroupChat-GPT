import {v4 as uuidv4} from "uuid";
import {ApiResponse} from "stores/chatStore";
import {getRobohashUrl} from "src/util/ImageUtils";
import {User} from "src/util/chat/User";
import {ValidDateTypes} from "src/util/DateUtils";
import {getSeededQColor} from "src/util/Colors";
import {AssistantPrompt} from "src/util/prompt/AssistantPrompt";
import {apiErrorToString} from "src/util/Utils";

export class Message {
	public static defaultBackgroundColor = "blue-grey-1";
	userId: string;
	userName: string;
	userAvatarUrl: string;
	dateCreated: ValidDateTypes = new Date();
	id: string = uuidv4();
	loading: boolean;
	followupMsgIds: string[] = [];
	isIgnored = false;
	textSnippets: string[] = [];
	imageUrls: string[] = [];
	apiResponse?: ApiResponse;
	prompt?: AssistantPrompt;

	constructor(chatUser?: User) {
		this.userId = chatUser?.id || "unknown";
		this.userName = chatUser?.name || "Unknown User";
		this.userAvatarUrl = getRobohashUrl(this.userName);
		this.isIgnored = chatUser?.defaultIgnored ?? false;
		this.loading = true;
	}

	parseApiResponse(apiResponse: ApiResponse) {
		this.apiResponse = apiResponse;
		console.log("ChatMessage.parseApiResponse:", this.apiResponse);

		if (apiResponse.data) {
			const textSnippets = apiResponse.data.choices?.flatMap((c: any) => {
				return c.text.trim();
			});
			if (textSnippets) {
				console.error("=> text:");
				textSnippets?.forEach((t: string) => console.error(t));
				this.textSnippets = textSnippets;
			}

			const imageUrls = apiResponse.data.data?.map((d: any) => d.url);
			if (imageUrls) {
				console.error("=> images:");
				imageUrls?.forEach((i: string) => console.log(i));
				this.imageUrls = imageUrls;
			}
		} else {
			console.error("parseApiResponse->apiResponse.data was undefined");
			this.textSnippets = ["[ERROR]" + "\n" + "Response data was undefined."];
		}

		if (apiResponse.error) {
			console.error("parseApiResponse->apiResponse.error:", apiResponse.error);
			this.textSnippets = ["[ERROR]" + "\n" + apiErrorToString(apiResponse.error)];
		}

		this.loading = false;
	}

	containsKeywords(keywords: string[]): boolean {
		const text: string = this.textSnippets.join(" ").toLowerCase();
		return keywords.some((keyword: string) =>
			text.includes(keyword.toLowerCase())
		);
	}

	hasTextSnippets() {
		return this.textSnippets.join("").trim().length > 0;
	}

	toggleIgnored() {
		console.warn("=> ignore:", {...this});
		this.isIgnored = this.isIgnored === undefined ? true : !this.isIgnored;
	}

	getBackgroundColor() {
		return getSeededQColor(this.userName, 1, 2)
	}
}
