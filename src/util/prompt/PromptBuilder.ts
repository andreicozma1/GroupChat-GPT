import {processItemizedList} from "src/util/ItemizedList";
import {Message} from "src/util/chat/Message";
import {User} from "src/util/chat/users/User";

export interface PromptConfig {
	promptHeader?: string;
	responseHeader?: string;
	// promptWrapTag?: string;
	// responseWrapTag?: string;
	traits?: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; // Order: Human, AI, Human, AI, etc.
	includeAllMembersInfo?: boolean;
}

export interface PromptTraits {
	personality?: string[];
	strengths?: string[];
	weaknesses?: string[];
	abilities?: string[];
}

export interface PromptRules {
	always?: string[];
	never?: string[];
	sometimes?: string[];
}

export class PromptBuilder {
	constructor(protected promptConfig: PromptConfig) {}

	getPromptRules(header = "RULES"): string | undefined {
		// if rules is undefined or all keys have empty arrays, return empty string
		if (!this.promptConfig.rules || Object.values(this.promptConfig.rules).every((v) => v.length === 0)) {
			return undefined
		}

		const rules = Object.entries(this.promptConfig.rules)
							.map(([k, v]) => {
								const s = v.map((s: string) => s.trim()).join("");
								if (s.length === 0) {
									return undefined;
								}
								k = k.toUpperCase();
								return processItemizedList(k,
														   v,
														   {
															   keyPrefix: "###",
														   });
							})
							.filter((s: string | undefined) => s !== undefined);

		return [this.h1(header), ...rules].join("\n\n");
	}

	getPromptExamples(
		header = "EXAMPLES"
	): string | undefined {
		if (!this.promptConfig.examples || this.promptConfig.examples.length == 0) {
			return undefined;
		}

		const examples: string = this.promptConfig.examples
									 .map((example: string, i) => {
										 const isQuery: boolean = i % 2 === 0;
										 const header = isQuery
														? this.promptConfig.promptHeader ?? "Prompt"
														: this.promptConfig.responseHeader ?? "Response"
										 return this.getPromptMessage(example, header);
									 })
									 .join("\n\n");

		return [this.h1(header), examples].join("\n");
	}

	getPromptConversation(
		messagesCtx: Message[],
		header = "CONVERSATION"
	): string {
		const res: string = messagesCtx
			.map((msg: Message) => {
				return this.getPromptMessage(msg.textSnippets
												.map((s: string) => s.trim())
												.join("\n"), msg.userId);
			})
			.join("\n\n");

		return [this.h1(header), res].join("\n");
	}

	public promptAssistantInfo(user: User, parenthesesTag?: string): string {
		let header = `### ${user.id}`;
		if (parenthesesTag) {
			header += ` [${parenthesesTag.toUpperCase()}]`;
		}
		header += ":";
		header += "\n";
		header += `# Name: ${user.name}`;

		if (!user.promptConfig.traits) {
			return header;
		}

		const info = Object.entries(user.promptConfig.traits)
						   .map(([k, v]) => {
							   const s = v.map((s: string) => s.trim()).join("");
							   if (s.length === 0) {
								   return undefined;
							   }
							   return processItemizedList(k, v, {keyPrefix: "#"});
						   })
						   .filter((s: string | undefined) => s !== undefined);

		return [header, ...info].join("\n");
	}

	public h1(header: string) {
		return `=== ${header} ===`;
	}

	private getPromptMessage(
		text: string,
		header: string
	): string {

		text = `### ${header}:\n${text}`;
		return text;
	}

}
