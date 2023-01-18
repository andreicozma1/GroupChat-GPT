import {v4 as uuidv4} from "uuid";
import {ApiResponse} from "stores/chatStore";
import {User} from "src/util/users/User";
import {getRobohashUrl} from "src/util/ImageUtils";
import {dateToLocaleStr, dateToTimeAgo} from "src/util/DateUtils";
import {getSingularOrPlural} from "src/util/TextUtils";

export class ChatMessage {
	userId: string;
	userName: string;
	userAvatarUrl: string;
	dateCreated: string | number | Date = new Date();
	id: string = uuidv4();
	loading: boolean;
	followupMsgIds: string[] = [];

	shouldDelete = false;
	isIgnored = false;
	textSnippets: string[] = [];
	imageUrls: string[] = [];
	apiResponse?: ApiResponse;

	constructor(chatUser?: User) {
		this.userId = chatUser?.id || "unknown";
		this.userName = chatUser?.name || "Unknown User";
		this.userAvatarUrl = getRobohashUrl(this.userName);
		this.loading = true;
	}

	parseApiResponse(apiResponse: ApiResponse) {
		this.apiResponse = apiResponse;
		console.log("ChatMessage.parseApiResponse:", this.apiResponse);

		const textSnippets = apiResponse.data?.choices?.flatMap((c: any) => {
			return c.text.trim();
		});
		if (textSnippets) {
			console.warn("=> text:");
			textSnippets?.forEach((t: string) => console.log(t));
			this.textSnippets = textSnippets;
		}

		const imageUrls = apiResponse.data?.data?.map((d: any) => d.url);
		if (imageUrls) {
			console.warn("=> images:");
			imageUrls?.forEach((i: string) => console.log(i));
			this.imageUrls = imageUrls;
		}

		if (apiResponse.errorMsg) {
			console.error("Error generating response:", apiResponse.errorMsg);
			this.textSnippets = ["[ERROR]" + "\n" + apiResponse.errorMsg];
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

	canRegenerate() {
		if (this.shouldDelete) return false;
		return true
		// const msgIds = this.apiResponse?.prompt.messagesCtxIds;
		// if (msgIds) return msgIds.length > 0;
		// return false;
	}

	toggleIgnored() {
		console.warn("=> ignore:", {...this});
		this.isIgnored = this.isIgnored === undefined ? true : !this.isIgnored;
	}


	getStamp() {
		// const what = isSentByMe(msg) ? "Sent" : "Received";
		const on = dateToTimeAgo(this.dateCreated);
		// let res = `${what} ${on}`;
		let res = `${on}`;
		// if (msg.isCompRegen) res = `* ${res}`;
		if (this.apiResponse?.fromCache) res = `${res} (from cache)`;
		return res;
	}

	getTextHoverHint(textSnippet?: string) {
		const numTexts = this.textSnippets?.length ?? 0;
		const numImages = this.imageUrls?.length ?? 0;
		// const who = (isSentByMe(this) ? "You" : this.userName) + ` (${this.userId})`
		const who = this.userName + ` (${this.userId})`;
		const what = `${numTexts} ${getSingularOrPlural(
			"text",
			numTexts
		)} and ${numImages} ${getSingularOrPlural("image", numImages)}`;
		const when = dateToLocaleStr(this.dateCreated);
		return `${who} sent ${what} on ${when}`;
		// return message.response?.prompt.text ?? fallback;
	}

	getImageHoverHint(imageUrl?: string) {
		return this.getTextHoverHint();
	}

	getLoadingHoverHint() {
		return "Loading...";
	}

	getStyle() {
		if (this.isIgnored)
			return {
				opacity: 0.5,
				// textDecoration: "line-through",
			};
		if (this.shouldDelete)
			return {
				outline: "2px dashed red",
				// borderRadius: "15px",
			};
		return {};
	}
}
