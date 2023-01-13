import {ChatMessage} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {User} from "src/util/users/User";
import {wrapInTag} from "src/util/TextUtils";
import {processItemizedList} from "src/util/ItemizedList";
import {dateToLocaleStr} from "src/util/DateUtils";
import {PromptConfig} from "src/util/prompt/PromptModels";
import {createRegexHtmlTagWithContent, rHtmlTagEnd, rHtmlTagStart, rHtmlTagWithContent} from "src/util/Utils";

export class PromptBuilder {
	constructor(protected promptConfig: PromptConfig) {}

	public static filterMessagesWithTags(messages: ChatMessage[]): ChatMessage[] {
		return messages.filter((msg: ChatMessage) => {
			return msg.textSnippets.some((text: string) => {
				return rHtmlTagWithContent.test(text);
			});
		});
	}

	public static filterSnippetsWithTags(textSnipets: string[], tag?: string): string[] {
		let regex = rHtmlTagWithContent
		if (tag?.trim()) regex = createRegexHtmlTagWithContent(tag)
		return textSnipets.filter((text: string) => {
			// return /(<([^>]+)>)/gi.test(text);
			return regex.test(text);
		});
	}

	public static getHash = (prompt: Prompt | string): string => {
		const hashStr = "undefined";
		let promptText = typeof prompt === "string" ? prompt : prompt.text;
		// lowercase, remove all punctuation
		promptText = promptText.toLowerCase();
		promptText = promptText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
		promptText = promptText.trim();
		if (promptText.length === 0) return hashStr;

		let hashInt = 0
		for (let i = 0; i < promptText.length; i++) {
			const char = promptText.charCodeAt(i);
			hashInt = (hashInt << 5) - hashInt + char;
			hashInt = hashInt & hashInt;
		}
		return hashInt.toString();
	};

	buildPrompt(...promptParts: string[]): string {
		if (this.promptConfig.responseHeader) promptParts.push(`### ${this.promptConfig.responseHeader}:`);
		promptParts = promptParts.filter((s) => s.length > 0);
		promptParts = promptParts.map((s) => s.trim());
		return promptParts.join("\n\n");
	}

	promptMembersInfo(currentUser: User, usersMap: { [key: string]: User }, header = "MEMBERS"): string {
		const availableAssistants: User[] = Object.values(usersMap).filter((a: User): boolean => {
			if (a.showInMembersInfo === undefined) return true;
			return a.showInMembersInfo;
		});
		if (!availableAssistants || availableAssistants.length === 0) return "";


		const isAvailable = availableAssistants.some((a: User) => a.id === currentUser.id)
		// sort such that the current user is last
		availableAssistants.sort((a: User, b: User) => {
			if (a.id === currentUser.id) return 1;
			if (b.id === currentUser.id) return -1;
			return 0;
		})

		const info: string[] = []
		if (!isAvailable) {
			availableAssistants.forEach(
				(user: User) => {
					info.push(this.promptAssistantInfo(user));
				}
			)
		} else {
			info.push(this.promptAssistantInfo(currentUser, "You"))
		}

		return [this.h1(header), ...info].join("\n\n");
	}

	getPromptRules(header = "RULES"): string {
		if (!this.promptConfig.rules) return "";

		const rules = Object.entries(this.promptConfig.rules)
			.map(([k, v]) => {
				const s = v.map((s: string) => s.trim()).join("");
				if (s.length === 0) return undefined;
				k = k.toUpperCase()
				return processItemizedList(k, v, {keyPrefix: '###'})
			})
			.filter((s: string | undefined) => s !== undefined)

		return [this.h1(header), ...rules].join("\n\n");
	}

	getPromptExamples(exampleQueryHeaderFallback = "Query", header = "EXAMPLES"): string {
		if (!this.promptConfig.examples || this.promptConfig.examples.length == 0) return "";

		const examples: string = this.promptConfig.examples.map((example: string, i) => {
			let msgPrompt = example.trim();
			const isQuery: boolean = i % 2 === 0;
			if (isQuery && this.promptConfig.queryWrapTag) {
				msgPrompt = wrapInTag(this.promptConfig.queryWrapTag, msgPrompt);
			}
			if (!isQuery && this.promptConfig.responseWrapTag) {
				msgPrompt = wrapInTag(this.promptConfig.responseWrapTag, msgPrompt);
			}
			const identifier = isQuery ? this.promptConfig.exampleQueryHeader ?? exampleQueryHeaderFallback : this.promptConfig.responseHeader;
			if (identifier) msgPrompt = `### ${identifier}:\n${msgPrompt}`;
			return msgPrompt;
		}).join("\n\n");

		return [this.h1(header), examples].join("\n");
	}

	getPromptConversation(messagesCtx: ChatMessage[], header = "CONVERSATION"): string {
		const res: string = messagesCtx.map((msg: ChatMessage, i) => {
			let msgPrompt = msg.textSnippets.map((s: string) => s.trim()).join("\n");
			const isQuery = i % 2 === 0;
			if (isQuery && this.promptConfig.queryWrapTag) {
				msgPrompt = msgPrompt.replace(/(<([^>]+)>)/gi, "");
				msgPrompt = wrapInTag(this.promptConfig.queryWrapTag, msgPrompt);
			}
			if (!isQuery && this.promptConfig.responseWrapTag) {
				msgPrompt = msgPrompt.replace(/(<([^>]+)>)/gi, "");
				msgPrompt = wrapInTag(this.promptConfig.responseWrapTag, msgPrompt);
			}
			msgPrompt = `### ${msg.userName}:\n${msgPrompt}`;
			return msgPrompt;
		}).join("\n\n");

		return [this.h1(header), res].join("\n");
	}

	private h1(header: string) {
		return `=== ${header} ===`;
	}

	private promptAssistantInfo(user: User, parenthesesTag?: string): string {
		parenthesesTag = parenthesesTag === undefined ? "" : ` [${parenthesesTag.toUpperCase()}]`;
		const header = `### ${user.name} (id: ${user.id}) ${parenthesesTag}:`;

		if (!user.promptConfig.traits) return header;

		const info = Object.entries(user.promptConfig.traits)
			.map(([k, v]) => {
				const s = v.map((s: string) => s.trim()).join("");
				if (s.length === 0) return undefined;
				return processItemizedList(k, v, {keyPrefix: "-"})
			})
			.filter((s: string | undefined) => s !== undefined)

		return [header, ...info].join("\n");
	}
}

export class Prompt extends PromptBuilder {

	public text: string;
	public hash: string;
	public createTextPrompt: () => string;

	// create a constructor
	constructor(
		public threadName: string,
		public humanUserName: string,
		public user: User,
		public usersMap: { [key: string]: User },
		public messagesCtx: ChatMessage[],
	) {
		super(user.promptConfig);
		// promptType if a function part of this class.
		this.createTextPrompt = Object.getPrototypeOf(this)[this.promptConfig.promptType];
		console.log(Object.getPrototypeOf(this));
		if (this.createTextPrompt === undefined) {
			const promptTypeDefault = "createAssistantPrompt";
			console.error(`Prompt type not found: ${this.promptConfig.promptType}. Defaulting to ${promptTypeDefault}`);
			smartNotify(`Prompt type not found: ${this.promptConfig.promptType}. Defaulting to ${promptTypeDefault}`);
			this.createTextPrompt = Object.getPrototypeOf(this)[promptTypeDefault];
		}
		this.text = this.createTextPrompt();
		this.hash = PromptBuilder.getHash(this)
	}

	public createAssistantPrompt(): string | undefined {
		const start = `=== AI GROUP CHAT: ${this.threadName} ===`
		const desc = [
			"The following is a group-chat conversation between a human and several AI assistants.",
			`Current Date-Time: ${dateToLocaleStr(new Date)}`
		];

		const members = this.promptMembersInfo(this.user, this.usersMap)
		const rules = this.getPromptRules();
		const examples = this.getPromptExamples(this.humanUserName);
		const conv = this.getPromptConversation(this.messagesCtx);

		return this.buildPrompt(start, desc.join("\n"), members, rules, examples, conv);
	}

	public createPromptDalleGen(): string | undefined {
		// now get the actual textSnippet that contains the html tag
		const promptSnippets = PromptBuilder.filterSnippetsWithTags(this.messagesCtx.flatMap((msg: ChatMessage) => msg.textSnippets), "dalle_gen");
		if (promptSnippets.length !== 0) {
			smartNotify('Using text within dalle_gen tags');
			return this.removeHtmlTags(promptSnippets[promptSnippets.length - 1])
		}
		const lastMsg = this.messagesCtx[this.messagesCtx.length - 1];
		if (lastMsg) {
			smartNotify('Using last message text snippet as prompt');
			return this.removeHtmlTags(lastMsg.textSnippets[lastMsg.textSnippets.length - 1])
		}
		smartNotify("Error: No prompt found");
		return undefined;
	}

	public removeHtmlTags(text: string): string {
		text = text.replace(rHtmlTagStart, "");
		text = text.replace(rHtmlTagEnd, "");
		return text.trim();
	}

	public createPromptCodexGen(): string | undefined {
		const start = "### CODE GENERATION ###\n";

		const rules = this.getPromptRules();

		const examples = this.getPromptExamples();

		// const usedMessage: ChatMessage = this.msgHist[this.msgHist.length - 1];
		// // last text
		// let prompt = `### ${promptHeader}:\n`;
		// prompt += usedMessage.textSnippets[
		// usedMessage.textSnippets.length - 1
		// 	].replace(/(<([^>]+)>)/gi, "");

		const usedMessages = PromptBuilder.filterMessagesWithTags(this.messagesCtx);
		if (usedMessages.length === 0) {
			smartNotify("Error: No messages with prompts found in message history");
			return undefined;
		}
		// now get the actual textSnippet that contains the html tag
		const promptSnippets = usedMessages[usedMessages.length - 1].textSnippets

		if (promptSnippets.length === 0) {
			smartNotify("Error: No prompt found in the conversation history");
			return undefined;
		}
		const prompt = promptSnippets[promptSnippets.length - 1];

		return this.buildPrompt(start, rules, examples, prompt);
	}

}

