import {smartNotify} from "src/util/SmartNotify";
import {getTextHash, removeAllHtmlTags, removeSpecifiedHtmlTags,} from "src/util/TextUtils";
import {PromptBuilder} from "src/util/prompt/PromptBuilder";
import {User} from "src/util/chat/User";
import {Message} from "src/util/chat/Message";

export class AssistantPrompt extends PromptBuilder {
	public messageContextIds: string[];
	public allTextSnippets: string[] = [];
	public createTextPrompt: () => string;

	public finalPromptText: string;
	public hash: string;
	public tHeader: string;
	public tInfo: string;
	public tRules: string;
	public tMembers: string;
	public tExamples: string;
	public tConversation: string;

	// create a constructor
	constructor(
		public threadName: string,
		public promptUser: User,
		allMembersArr: User[],
		messagesCtx: Message[]
	) {
		super(promptUser.promptConfig);
		this.messageContextIds = messagesCtx.map((m: Message) => m.id);
		this.allTextSnippets = messagesCtx.flatMap((m: Message) => m.textSnippets);

		this.tHeader = `=== AI GROUP CHAT: "${this.threadName}" ===`;
		this.tInfo = this.getPromptInfo()
		this.tMembers = this.getPromptMembersInfo(this.promptUser, allMembersArr);
		this.tRules = this.getPromptRules();
		this.tExamples = this.getPromptExamples();
		this.tConversation = this.getPromptConversation(messagesCtx);

		// promptType if a function part of this class.
		this.createTextPrompt =
			Object.getPrototypeOf(this)[this.promptConfig.promptType];
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
		return this.buildPrompt(
			this.tHeader,
			this.tInfo,
			this.tMembers,
			this.tRules,
			this.tExamples,
			this.tConversation
		);
	}

	public createPromptDalleGen(): string | undefined {
		// now get the actual textSnippet that contains the html tag

		const prompts = PromptBuilder.filterSnippetsWithTags(
			this.allTextSnippets,
			"dalle_gen"
		);

		if (prompts.length === 0) {
			smartNotify("Prompt not found");
			return undefined;
		}

		return removeAllHtmlTags(prompts[prompts.length - 1]);
	}

	public createPromptCodexGen(): string | undefined {
		const start = "### CODE GENERATION ###\n";

		const prompts = PromptBuilder.filterSnippetsWithTags(
			this.allTextSnippets,
			"codex_gen"
		);

		if (prompts.length === 0) {
			smartNotify("Prompt not found");
			return undefined;
		}

		const prompt = removeAllHtmlTags(prompts[prompts.length - 1]);

		return this.buildPrompt(start, this.tRules, this.tExamples, prompt);
	}
}
