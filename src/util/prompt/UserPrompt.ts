import {getTextHash, removeSpecifiedHtmlTags,} from "src/util/TextUtils";
import {PromptBuilder, PromptConfig} from "src/util/prompt/PromptBuilder";
import {Message} from "src/util/chat/Message";
import {Thread} from "src/util/chat/Thread";
import {smartNotify} from "src/util/SmartNotify";
import {assistantFilter, User} from "src/util/chat/users/User";
import {processItemizedList} from "src/util/ItemizedList";

export class UserPrompt extends PromptBuilder {
	public text = "undefined";
	public hash = "undefined";
	public messageContextIds?: string[]
	private promptParts: string[] = []

	// create a constructor
	constructor(
		protected promptConfig: PromptConfig
	) {
		super(promptConfig);
	}

	addStart = (currentUser: User, thread: Thread) => {
		const promptStart = currentUser.getPromptStart(thread);
		if (promptStart) {
			this.promptParts.push(promptStart);
			this.update()
		}
	}

	addMembersInfo(currentUser: User, allMembersArr: User[]) {
		if (!this.promptConfig.includeAllMembersInfo) {
			return;
		}
		const availableAssistants: User[] = allMembersArr.filter(
			(a: User): boolean => a.showInMembersInfo ?? true
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
			availableAssistants
				.filter((a: User) => a.id !== currentUser.id)
				.forEach((user: User) => {
					info.push(this.promptAssistantInfo(user));
				});
			info.push(this.promptAssistantInfo(currentUser));
			info.push(this.getHeader2(`You are ${currentUser.name} (id: ${currentUser.id})`));
		}

		this.promptParts.push([this.getHeader1("Chat Members"), ...info].join("\n\n"));
		this.update()
	}

	addRules = () => {
		if (!this.promptConfig.rules || Object.values(this.promptConfig.rules).every((v) => v.length === 0)) {
			return
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
															   keyPrefix: "##",
														   });
							})
							.filter((s: string | undefined) => s !== undefined);

		// const header = this.getHeader1(`${currentUser.name}'s Rules & Behaviors`)
		const header = this.getHeader1("Your Rules & Behaviors")

		this.promptParts.push([header, ...rules].join("\n\n"))
		this.update()
	}

	addExamples() {
		if (!this.promptConfig.examples || this.promptConfig.examples.length == 0) {
			return;
		}

		const examples: string = this.promptConfig.examples
									 .map((example: string, i) => {
										 const isQuery: boolean = i % 2 === 0;
										 const header = isQuery
														? this.promptConfig.promptHeader ?? "user"
														: this.promptConfig.responseHeader ?? "assistant"
										 return this.getPromptMessage(example, header);
									 })
									 .join("\n\n");

		// const header = this.getHeader1(`${currentUser.name}'s Examples`)
		const header = this.getHeader1("Your Examples")

		this.promptParts.push([header, examples].join("\n"));
		this.update()
	}

	addConversationContext(messages: Message[]) {

		const res: string = messages
			.map((msg: Message) => {
				return this.getPromptMessage(msg.textSnippets
												.map((s: string) => s.trim())
												.join("\n"), msg.userId);
			})
			.join("\n\n");

		this.promptParts.push([this.getHeader1("Current Conversation"), res].join("\n"))
		this.messageContextIds = messages.map(m => m.id);
		this.update()
	}

	addPromptText = (str: string) => {
		const l = [];
		if (this.promptConfig.promptHeader) {
			l.push(this.getHeader4(this.promptConfig.promptHeader));
		}
		l.push(str);
		this.promptParts.push(l.join("\n"));
		this.update()
	}

	addPromptEnd = () => {
		if (this.promptConfig.responseHeader) {
			this.promptParts.push(this.getHeader4(this.promptConfig.responseHeader));
		}
		this.update()
	}

	update = () => {
		this.promptParts = this.promptParts.filter((s) => s.length > 0);
		this.promptParts = this.promptParts.map((s) => s.trim());

		const finalPrompt = this.promptParts.join("\n\n");

		this.hash = getTextHash(removeSpecifiedHtmlTags(finalPrompt, "nocache", true));
		this.text = removeSpecifiedHtmlTags(finalPrompt, "nocache", false);
	}
}
