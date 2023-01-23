import {processItemizedList} from "src/util/ItemizedList";
import {newlineSeparated, wrapInHtmlTag} from "src/util/TextUtils";
import {Message} from "src/util/chat/Message";
import {User} from "src/util/chat/User";
import {smartNotify} from "src/util/SmartNotify";
import {dateToLocaleStr} from "src/util/DateUtils";
import {assistantFilter} from "src/util/chat/assistants/chatting/UserChattingAssistant";

export interface PromptConfig {
	promptHeader?: string;
	responseHeader?: string;
	// promptWrapTag?: string;
	// responseWrapTag?: string;
	traits?: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; // Order: Human, AI, Human, AI, etc.
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

	buildPrompt(...promptParts: string[]): string {
		if (this.promptConfig.responseHeader) {
			promptParts.push(`### ${this.promptConfig.responseHeader}:`);
		}
		promptParts = promptParts.filter((s) => s.length > 0);
		promptParts = promptParts.map((s) => s.trim());
		return promptParts.join("\n\n");
	}

	getPromptInfo(): string {
		return newlineSeparated(
			"The following is a group-chat conversation between a human and several AI assistants.",
			wrapInHtmlTag(
				"nocache",
				`Current Date-Time: ${dateToLocaleStr(new Date())}`
			))
	}

	getPromptMembersInfo(
		currentUser: User,
		usersArr: User[],
		header = "MEMBERS"
	): string {
		const availableAssistants: User[] = usersArr.filter(
			(a: User): boolean => {
				if (a.showInMembersInfo === undefined) {
					return true;
				}
				return a.showInMembersInfo;
			}
		).filter(assistantFilter);

		if (!availableAssistants || availableAssistants.length === 0) {
			smartNotify(
				"Warning: There are no assistants in this thread!",
				"You can add assistants in the thread preferences menu."
			);
			throw new Error("No assistants are available at the moment.");
		}

		const isAvailable = availableAssistants.some(
			(a: User) => a.id === currentUser.id
		);
		// sort such that the current user is last
		availableAssistants.sort((a: User, b: User) => {
			if (a.id === currentUser.id) {
				return 1;
			}
			if (b.id === currentUser.id) {
				return -1;
			}
			return 0;
		});

		const info: string[] = [];
		if (!isAvailable) {
			availableAssistants.forEach((user: User) => {
				info.push(this.promptAssistantInfo(user));
			});
		} else {
			info.push(this.promptAssistantInfo(currentUser, "You"));
			availableAssistants
				.filter((a: User) => a.id !== currentUser.id)
				.forEach((user: User) => {
					info.push(this.promptAssistantInfo(user));
				});
		}

		return [this.h1(header), ...info].join("\n\n");
	}

	getPromptRules(header = "RULES"): string {
		// if rules is undefined or all keys have empty arrays, return empty string
		if (!this.promptConfig.rules || Object.values(this.promptConfig.rules).every((v) => v.length === 0)) {
			return "";
		}

		const rules = Object.entries(this.promptConfig.rules)
							.map(([k, v]) => {
								const s = v.map((s: string) => s.trim()).join("");
								if (s.length === 0) {
									return undefined;
								}
								k = k.toUpperCase();
								return processItemizedList(k, v, {keyPrefix: "###"});
							})
							.filter((s: string | undefined) => s !== undefined);

		return [this.h1(header), ...rules].join("\n\n");
	}

	getPromptExamples(
		header = "EXAMPLES"
	): string {
		if (!this.promptConfig.examples || this.promptConfig.examples.length == 0) {
			return "";
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

	private getPromptMessage(
		text: string,
		header: string
	): string {
		// if (isPrompt && this.promptConfig.promptWrapTag) {
		// 	text = wrapInHtmlTag(this.promptConfig.promptWrapTag, text);
		// }
		// if (!isPrompt && this.promptConfig.responseWrapTag) {
		// 	text = wrapInHtmlTag(
		// 		this.promptConfig.responseWrapTag,
		// 		text
		// 	);
		// }

		text = `### ${header}:\n${text}`;
		return text;
	}

	private promptAssistantInfo(user: User, parenthesesTag?: string): string {
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

	private h1(header: string) {
		return `=== ${header} ===`;
	}

}
