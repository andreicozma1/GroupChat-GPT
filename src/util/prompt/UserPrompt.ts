import {getTextHash, removeSpecifiedHtmlTags,} from "src/util/TextUtils";
import {PromptBuilder} from "src/util/prompt/PromptBuilder";
import {User} from "src/util/chat/User";
import {Message} from "src/util/chat/Message";

export class UserPrompt extends PromptBuilder {

	public finalPromptText = "undefined";
	public hash = "undefined";
	public messageContextIds?: string[]

	// create a constructor
	constructor(
		public promptUser: User,
	) {
		super(promptUser.promptConfig);
	}

	fromThread(threadName: string, allMembersArr: User[], messages: Message[]) {
		const tHeader = `=== AI GROUP CHAT: "${threadName}" ===`;
		const tInfo = this.getPromptInfo()
		const tMembers = this.getPromptMembersInfo(this.promptUser, allMembersArr);
		const tRules = this.getPromptRules();
		const tExamples = this.getPromptExamples();
		const tConversation = this.getPromptConversation(messages);
		this.messageContextIds = messages.map(m => m.id);

		const text = this.buildPrompt(
			tHeader,
			tInfo,
			tMembers,
			tRules,
			tExamples,
			tConversation
		);
		this.fromText(text);
	}

	fromText = (text: string) => {
		this.hash = getTextHash(removeSpecifiedHtmlTags(text, "nocache", true));
		this.finalPromptText = removeSpecifiedHtmlTags(text, "nocache", false);
	}
}
