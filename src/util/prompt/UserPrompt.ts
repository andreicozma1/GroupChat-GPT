import {getTextHash, removeSpecifiedHtmlTags,} from "src/util/TextUtils";
import {PromptBuilder} from "src/util/prompt/PromptBuilder";
import {Message} from "src/util/chat/Message";
import {Thread} from "src/util/chat/Thread";
import {smartNotify} from "src/util/SmartNotify";
import {assistantFilter, User} from "src/util/chat/users/User";

export class UserPrompt extends PromptBuilder {
	public text = "undefined";
	public hash = "undefined";
	public messageContextIds?: string[]
	private promptParts: string[] = []

	// create a constructor
	constructor(
		public promptUser: User,
	) {
		super(promptUser.promptConfig);
	}

	addStart = (thread: Thread) => {
		const promptStart = this.promptUser.getPromptStart(thread);
		if (promptStart) {
			this.promptParts.push(promptStart);
		} else {
			this.promptParts.push(`### ${thread.name}`);
		}
		this.update()
	}

	addMembersInfo(allMembersArr: User[]) {
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
			(a: User) => a.id === this.promptUser.id
		);

		// sort such that the current user is last
		availableAssistants.sort((a: User, b: User) => {
			if (a.id === this.promptUser.id) {
				return 1;
			}
			if (b.id === this.promptUser.id) {
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
			info.push(this.promptAssistantInfo(this.promptUser, "You"));
			availableAssistants
				.filter((a: User) => a.id !== this.promptUser.id)
				.forEach((user: User) => {
					info.push(this.promptAssistantInfo(user));
				});
		}

		const membersInfo = [this.h1("MEMBERS"), ...info].join("\n\n");

		this.promptParts.push(membersInfo);
		this.update()
	}

	addRules = () => {
		const rules = this.getPromptRules()
		if (!rules) {
			return
		}
		this.promptParts.push(rules)
		this.update()
	}

	addExamples() {
		const examples = this.getPromptExamples()
		if (!examples) {
			return
		}
		this.promptParts.push(examples);
		this.update()
	}

	addConversationContext(messages: Message[]) {
		this.promptParts.push(this.getPromptConversation(messages))
		this.messageContextIds = messages.map(m => m.id);
		this.update()
	}

	addPromptText = (str: string) => {
		const l = [];
		if (this.promptConfig.promptHeader) {
			l.push(`### ${this.promptConfig.promptHeader}:`);
		}
		l.push(str);
		this.promptParts.push(l.join("\n"));
		this.update()
	}

	addPromptEnd = () => {
		if (this.promptConfig.responseHeader) {
			this.promptParts.push(`### ${this.promptConfig.responseHeader}:`);
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
