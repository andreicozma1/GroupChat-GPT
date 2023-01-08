import {ChatUser} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {processKV} from "src/util/assistant/AssistantUtils";
import {PromptConfig} from "src/util/prompt/PromptModels";
import {ConfigUser} from "src/util/users/ConfigUser";


function wrapInTags(tag: string, ...msgPrompt: string[]) {
	return [
		`<${tag}>`,
		msgPrompt,
		`</${tag}>`
	].join("\n");
}

export class Prompt {

	public currentUserName: string;
	public currentUserId: string;

	public text: string;
	public hash: string;
	public createTextPrompt: () => string;

	// create a constructor
	constructor(
		public config: PromptConfig,
		public usersMap: { [key: string]: ChatUser },
		public msgHist: ChatMessage[],
	) {
		const lastMessage: ChatMessage = msgHist[msgHist.length - 1];
		if (lastMessage) {
			this.currentUserName = lastMessage.userName
			this.currentUserId = lastMessage.userId
		} else {
			this.currentUserName = "Unknown";
			this.currentUserId = "Unknown";
			console.error(`No messages found in message history`);
			smartNotify(`No messages found in message history`);
		}
		this.config = Prompt.parseConfig(config, this.currentUserName);

		this.usersMap = usersMap;
		this.msgHist = msgHist;
		// promptType if a function part of this class.
		this.createTextPrompt = Object.getPrototypeOf(this)[this.config.promptType];
		console.log(Object.getPrototypeOf(this));
		if (this.createTextPrompt === undefined) {
			const promptTypeDefault = "createAssistantPrompt";
			console.error(`Prompt type not found: ${this.config.promptType}. Defaulting to ${promptTypeDefault}`);
			smartNotify(`Prompt type not found: ${this.config.promptType}. Defaulting to ${promptTypeDefault}`);
			this.createTextPrompt = Object.getPrototypeOf(this)[promptTypeDefault];
		}
		this.text = this.createTextPrompt();
		this.hash = Prompt.hashPrompt(this)
	}

	public createAssistantPrompt(): string | undefined {
		const start = "=== AI GROUP CHAT ===";
		const desc = "The following is a group-chat conversation between a human and several AI assistants.";

		const members = this.promptMembersInfo();
		const rules = this.promptRules();
		const examples = this.promptExamples();
		const conv = this.promptConversation();

		return this.finalizePrompt([start, desc, members, rules, examples, conv]);
	}

	public createPromptDalleGen(): string | undefined {
		// find the last message that contains a html tag in any of the text snippets
		const usedMessages = this.getMessagesWithQueries();
		if (usedMessages.length === 0) {
			smartNotify("Error: No messages with prompts found in message history");
			return undefined;
		}
		// now get the actual textSnippet that contains the html tag
		const promptSnippets = usedMessages[usedMessages.length - 1].textSnippets.filter((text: string) => {
			return /(<([^>]+)>)/gi.test(text);
		})

		if (promptSnippets.length === 0) {
			smartNotify("Error: No prompt found in the conversation history");
			return undefined;
		}

		let prompt = promptSnippets[promptSnippets.length - 1];
		prompt = prompt.replace(/(<([^>]+)>)/gi, "");

		return prompt;
	}


	public createPromptCodexGen(): string | undefined {
		const start = "### CODE GENERATION ###\n";

		const rules = this.promptRules();

		const examples = this.promptExamples();

		// const usedMessage: ChatMessage = this.msgHist[this.msgHist.length - 1];
		// // last text
		// let prompt = `### ${promptHeader}:\n`;
		// prompt += usedMessage.textSnippets[
		// usedMessage.textSnippets.length - 1
		// 	].replace(/(<([^>]+)>)/gi, "");

		const usedMessages: ChatMessage[] = this.msgHist.filter((msg) => {
			// based on regex
			return msg.textSnippets.some((text: string) => {
				return /(<([^>]+)>)/gi.test(text);
			});
		});
		if (usedMessages.length === 0) {
			smartNotify("Error: No messages with prompts found in message history");
			return undefined;
		}
		// now get the actual textSnippet that contains the html tag
		const promptSnippets = usedMessages[usedMessages.length - 1].textSnippets.filter((text: string) => {
			return /(<([^>]+)>)/gi.test(text);
		})

		if (promptSnippets.length === 0) {
			smartNotify("Error: No prompt found in the conversation history");
			return undefined;
		}
		let prompt = promptSnippets[promptSnippets.length - 1];
		prompt = prompt.replace(/(<([^>]+)>)/gi, "");

		return this.finalizePrompt([start, rules, examples, prompt]);
	}

	private promptAssistantInfo(ai: ChatUser, parenthesesTag?: string): string {
		parenthesesTag = parenthesesTag === undefined ? "" : ` (${parenthesesTag})`;
		const header = `# ${ai.name}${parenthesesTag}`;

		if (!ai.promptConfig.traits) return header;

		const info: string = Object.entries(ai.promptConfig.traits)
			.map(([k, v]) => {
				return processKV(k, v, {keyStartChar: "-"})
			})
			.join("\n");

		return [header, info].join("\n");
	}

	private promptMembersInfo(): string {
		const availableAssistants: ChatUser[] = Object.values(this.usersMap).filter((a: ChatUser): boolean => {
			if (a.isAvailable === undefined) return true;
			return a.isAvailable;
		});
		if (!availableAssistants || availableAssistants.length === 0) return "";

		const header = "=== CHAT MEMBERS ===";

		const info: string = availableAssistants
			.map((assistant: ChatUser) => {
				let tag = undefined;
				if (this.currentUserId === assistant.id) tag = "You";
				return this.promptAssistantInfo(assistant, tag);
			})
			.join("\n\n");

		return [header, info].join("\n");
	}

	private promptRules(): string {
		if (!this.config.rules) return "";

		const header = "=== RULES ===";

		const rules: string = Object.entries(this.config.rules)
			.map(([k, v]) => {
				return processKV(k, v, {keyStartChar: "#",})
			})
			.join("\n");

		return [header, rules].join("\n");
	}

	private promptExamples(): string {
		if (!this.config.examples || this.config.examples.length == 0) return "";
		// promptHeader = promptHeader || ConfigUser.name;
		// resultHeader = resultHeader || ai.name;
		const header = "=== EXAMPLES ===";

		const examples: string = this.config.examples.map((example: string, i) => {
			let msgPrompt = example.trim();
			const isQuery: boolean = i % 2 === 0;
			if (isQuery && this.config.queryWrapTag) {
				msgPrompt = wrapInTags(this.config.queryWrapTag, msgPrompt);
			}
			if (!isQuery && this.config.responseWrapTag) {
				msgPrompt = wrapInTags(this.config.responseWrapTag, msgPrompt);
			}
			const identifier = isQuery ? this.config.queryHeader : this.config.responseHeader;
			if (this.config.useHeader) msgPrompt = `### ${identifier}:\n${msgPrompt}`;
			return msgPrompt;
		}).join("\n\n");

		return [header, examples].join("\n");
	}

	private promptConversation(): string {
		const header = "=== CONVERSATION ===";

		const res: string = this.msgHist.map((msg: ChatMessage, i) => {
			let msgPrompt = msg.textSnippets.map((s: string) => s.trim()).join("\n");
			const isQuery = i % 2 === 0;
			if (isQuery && this.config.queryWrapTag) {
				msgPrompt = wrapInTags(this.config.queryWrapTag, msgPrompt);
			}
			if (!isQuery && this.config.responseWrapTag) {
				msgPrompt = wrapInTags(this.config.responseWrapTag, msgPrompt);
			}
			const identifier = isQuery ? this.config.queryHeader : this.config.responseHeader;
			if (this.config.useHeader) msgPrompt = `### ${identifier}:\n${msgPrompt}`;
			return msgPrompt;
		}).join("\n\n");

		return [header, res].join("\n");
	}

	private finalizePrompt(all: string[]): string {
		if (this.config.useHeader) {
			const end = `### ${this.config.responseHeader}:`;
			all.push(end);
		}
		all = all.filter((s) => s.length > 0);
		all = all.map((s) => s.trim());
		return all.join("\n\n");
	}

	private getMessagesWithQueries(): ChatMessage[] {
		return this.msgHist.filter((msg) => {
			// based on regex
			return msg.textSnippets.some((text: string) => {
				return /(<([^>]+)>)/gi.test(text);
			});
		});
	}

	public static parseConfig = (config: PromptConfig, currentUserName: string): PromptConfig => {
		return {
			...config,
			promptType: "createAssistantPrompt",
			queryHeader: config?.queryHeader ?? ConfigUser.name,
			responseHeader: config?.responseHeader ?? currentUserName,
			useHeader: config?.useHeader ?? true,
		}
	}

	public static hashPrompt = (prompt: Prompt | string): string => {
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

}

