import {smartNotify} from "src/util/SmartNotify";
import {User} from "src/util/users/User";
import {getTextHash, removeAllHtmlTags, removeSpecifiedHtmlTags, wrapInHtmlTag} from "src/util/TextUtils";
import {dateToLocaleStr} from "src/util/DateUtils";
import {ChatMessage} from "src/util/chat/ChatMessage";
import {PromptBuilder} from "src/util/prompt/PromptBuilder";

export class AssistantPrompt extends PromptBuilder {
	public text: string;
	public hash: string;
	public messagesCtxIds: string[];
	public createTextPrompt: () => string;

	// create a constructor
	constructor(
		public threadName: string,
		public humanUserName: string,
		public user: User,
		public usersMap: { [key: string]: User },
		public messagesCtx: ChatMessage[]
	) {
		super(user.promptConfig);
		this.messagesCtxIds = messagesCtx.map((m: ChatMessage) => m.id);
		// promptType if a function part of this class.
		this.createTextPrompt = Object.getPrototypeOf(this)[this.promptConfig.promptType];
		console.log(Object.getPrototypeOf(this));
		if (this.createTextPrompt === undefined) {
			const promptTypeDefault = "createAssistantPrompt";
			console.error(
				`Prompt type not found: ${this.promptConfig.promptType}. Defaulting to ${promptTypeDefault}`
			);
			smartNotify(
				`Prompt type not found: ${this.promptConfig.promptType}. Defaulting to ${promptTypeDefault}`
			);
			this.createTextPrompt = Object.getPrototypeOf(this)[promptTypeDefault];
		}
		const text = this.createTextPrompt();
		this.hash = getTextHash(removeSpecifiedHtmlTags(text, "nocache", true));
		this.text = removeSpecifiedHtmlTags(text, "nocache", false);
	}

	public createAssistantPrompt(): string | undefined {
		const start = `=== AI GROUP CHAT: "${this.threadName}" ===`;
		const desc = [
			"The following is a group-chat conversation between a human and several AI assistants.",
			wrapInHtmlTag("nocache", `Current Date-Time: ${dateToLocaleStr(new Date())}`),
		];

		const members = this.promptMembersInfo(this.user, this.usersMap);
		const rules = this.getPromptRules();
		const examples = this.getPromptExamples(this.humanUserName);
		const conv = this.getPromptConversation(this.messagesCtx);

		return this.buildPrompt(
			start,
			desc.join("\n"),
			members,
			rules,
			examples,
			conv
		);
	}

	public createPromptDalleGen(): string | undefined {
		// now get the actual textSnippet that contains the html tag
		const allSnippets = this.messagesCtx.flatMap((m: ChatMessage) => m.textSnippets);
		const prompts = PromptBuilder.filterSnippetsWithTags(allSnippets, "dalle_gen");

		if (prompts.length === 0) {
			smartNotify("Prompt not found")
			return undefined;
		}

		const prompt = removeAllHtmlTags(prompts[prompts.length - 1]);

		return prompt;
	}

	public createPromptCodexGen(): string | undefined {
		const start = "### CODE GENERATION ###\n";

		const rules = this.getPromptRules();

		const examples = this.getPromptExamples();

		const allSnippets = this.messagesCtx.flatMap((m: ChatMessage) => m.textSnippets);
		const prompts = PromptBuilder.filterSnippetsWithTags(allSnippets, "codex_gen");

		if (prompts.length === 0) {
			smartNotify("Prompt not found")
			return undefined;
		}

		const prompt = removeAllHtmlTags(prompts[prompts.length - 1]);

		return this.buildPrompt(start, rules, examples, prompt);
	}
}
