import {getTextHash, removeSpecifiedHtmlTags,} from "src/util/TextUtils";
import {PromptBuilder} from "src/util/prompt/PromptBuilder";
import {User} from "src/util/chat/User";
import {Message} from "src/util/chat/Message";

export class AssistantPrompt extends PromptBuilder {

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

	// public createPromptDalleGen(): string | undefined {
	// 	// now get the actual textSnippet that contains the html tag
	//
	// 	const prompts = PromptBuilder.filterSnippetsWithTags(
	// 		this.allTextSnippets,
	// 		"dalle_gen"
	// 	);
	//
	// 	if (prompts.length === 0) {
	// 		smartNotify("Prompt not found");
	// 		return undefined;
	// 	}
	//
	// 	return removeAllHtmlTags(prompts[prompts.length - 1]);
	// }
	//
	// public createPromptCodexGen(): string | undefined {
	// 	const start = "### CODE GENERATION ###\n";
	//
	// 	const prompts = PromptBuilder.filterSnippetsWithTags(
	// 		this.allTextSnippets,
	// 		"codex_gen"
	// 	);
	//
	// 	if (prompts.length === 0) {
	// 		smartNotify("Prompt not found");
	// 		return undefined;
	// 	}
	//
	// 	const prompt = removeAllHtmlTags(prompts[prompts.length - 1]);
	//
	// 	return this.buildPrompt(start, this.tRules, this.tExamples, prompt);
	// }
}
