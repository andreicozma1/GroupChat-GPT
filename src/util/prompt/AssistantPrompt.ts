import {smartNotify} from "src/util/SmartNotify";
import {User} from "src/util/users/User";
import {getTextHash, removeAllHtmlTags, removeSpecifiedHtmlTags, wrapInHtmlTag} from "src/util/TextUtils";
import {dateToLocaleStr} from "src/util/DateUtils";
import {Message} from "src/util/message/Message";
import {PromptBuilder} from "src/util/prompt/PromptBuilder";

export class AssistantPrompt extends PromptBuilder {

	public messageContextIds: string[];
	public allTextSnippets: string[] = [];
	public createTextPrompt: () => string;

	public finalPromptText: string;
	public hash: string;
	public tRules: string;
	public tMembers: string;
	public tExamples: string;
	public tConversation: string;

	// create a constructor
	constructor(
		public threadName: string,
		public humanUserName: string,
		public user: User,
		usersMap: { [key: string]: User },
		messagesCtx: Message[]
	) {
		super(user.promptConfig);
		this.messageContextIds = messagesCtx.map((m: Message) => m.id);
		this.allTextSnippets = messagesCtx.flatMap((m: Message) => m.textSnippets);

		this.tMembers = this.promptMembersInfo(this.user, usersMap);
		this.tRules = this.getPromptRules();
		this.tExamples = this.getPromptExamples(this.humanUserName);
		this.tConversation = this.getPromptConversation(messagesCtx);

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
		this.finalPromptText = removeSpecifiedHtmlTags(text, "nocache", false);
	}

	public createAssistantPrompt(): string | undefined {
		const start = `=== AI GROUP CHAT: "${this.threadName}" ===`;
		const desc = [
			"The following is a group-chat conversation between a human and several AI assistants.",
			wrapInHtmlTag("nocache", `Current Date-Time: ${dateToLocaleStr(new Date())}`),
		];

		return this.buildPrompt(
			start,
			desc.join("\n"),
			this.tMembers,
			this.tRules,
			this.tExamples,
			this.tConversation
		);
	}

	public createPromptDalleGen(): string | undefined {
		// now get the actual textSnippet that contains the html tag

		const prompts = PromptBuilder.filterSnippetsWithTags(this.allTextSnippets, "dalle_gen");

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

		const prompts = PromptBuilder.filterSnippetsWithTags(this.allTextSnippets, "codex_gen");

		if (prompts.length === 0) {
			smartNotify("Prompt not found")
			return undefined;
		}

		const prompt = removeAllHtmlTags(prompts[prompts.length - 1]);

		return this.buildPrompt(start, rules, examples, prompt);
	}
}
