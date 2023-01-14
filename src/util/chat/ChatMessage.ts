import {v4 as uuidv4} from "uuid";
import {ApiResponse} from "stores/chatStore";
import {User} from "src/util/users/User";
import {getRobohashUrl} from "src/util/ImageUtils";

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
	) {
		this.userId = chatUser?.id || "unknown";
		this.userName = chatUser?.name || "Unknown User";
		this.userAvatarUrl = getRobohashUrl(this.userName)
		this.loading = true
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
			this.textSnippets = ["[ERROR]" + "\n" + apiResponse.errorMsg]
		}
	}

}