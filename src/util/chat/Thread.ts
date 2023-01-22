import {getAppVersion} from "src/util/Utils";
import {v4 as uuidv4} from "uuid";
import {smartNotify} from "src/util/SmartNotify";
import {parseDate} from "src/util/DateUtils";
import {Message} from "src/util/chat/Message";
import {User} from "src/util/chat/User";

export interface ChatThreadPrefs {
	hiddenUserIds: string[];
	hideIgnoredMessages: boolean;
	orderedResponses: boolean;
}

export class Thread {
	private static readonly defaultThreadName = "New Thread";
	private static readonly defaultPrefs: ChatThreadPrefs = {
		hiddenUserIds: [],
		hideIgnoredMessages: false,
		orderedResponses: true,
	};

	public id: string;
	public name: string;
	public prefs: ChatThreadPrefs = Thread.defaultPrefs;
	public appVersion: string = getAppVersion();
	public infoMessage?: string;
	private joinedUserIds: string[] = [];
	private messageIdMap: { [key: string]: Message } = {};

	constructor(
		public ownerId: string,
		name?: string,
	) {
		this.id = uuidv4();
		this.name = name ?? Thread.defaultThreadName
	}

	addUser(user: User): void {
		this.joinedUserIds.push(user.id);
		if (user.requiresUserIds) this.joinedUserIds.push(...user.requiresUserIds);
		// de-duplicate
		this.joinedUserIds = Array.from(new Set(this.joinedUserIds));
	}

	getJoinedUsers(getUserCallback: (id: string) => User | undefined): User[] {
		return this.joinedUserIds
			.map(getUserCallback)
			.filter((u: User | undefined) => u !== undefined) as User[];
	}

	getMessageIdMap(): { [key: string]: Message } {
		for (const messageId in this.messageIdMap) {
			if (!(this.messageIdMap[messageId] instanceof Message)) {
				console.warn("Prototype does not match ChatMessage");
				console.log("getMessagesIdsMap->before:", this.messageIdMap[messageId]);
				this.messageIdMap[messageId] = Object.assign(
					new Message(),
					this.messageIdMap[messageId]
				);
				console.log("getMessagesIdsMap->after:", this.messageIdMap[messageId]);
			}
		}
		return this.messageIdMap;
	}

	getMessagesArray(): Message[] {
		const messages: Message[] = Object.values(this.getMessageIdMap());
		messages.sort((a: Message, b: Message) => {
			const ad = parseDate(a.dateCreated).getTime();
			const bd = parseDate(b.dateCreated).getTime();
			return ad - bd;
		});
		return messages;
	}

	getMessagesArrayFromIds(messageIds: string[]): Message[] {
		const messages: Message[] = messageIds
			.map((messageId: string) => this.getMessageIdMap()[messageId])
			.filter((message: Message | undefined) => message !== undefined);
		messages.sort((a: Message, b: Message) => {
			const ad = parseDate(a.dateCreated).getTime();
			const bd = parseDate(b.dateCreated).getTime();
			return ad - bd;
		});
		return messages;
	}

	addMessage(message: Message): void {
		if (this.getMessageIdMap()[message.id]) {
			delete this.messageIdMap[message.id];
		}
		this.messageIdMap[message.id] = message;
	}

	getMessageById(messageId: string): Message | undefined {
		return this.getMessageIdMap()[messageId];
	}

	deleteMessage(messageId: string): void {
		if (!this.getMessageIdMap()[messageId]) {
			smartNotify("An error occurred while deleting the message.");
			console.error(
				`An error occurred while deleting the message: ${messageId}`
			);
			return;
		}
		const followUpIds = this.messageIdMap[messageId].followupMsgIds;
		followUpIds?.forEach((followUpId: string) => {
			this.deleteMessage(followUpId);
		});
		delete this.messageIdMap[messageId];
		this.notify(`Deleted message: ${messageId}`);
	}

	clearMessages(): void {
		this.notify("Clearing messages");
		this.messageIdMap = {};
	}

	clearJoinedUsers(): void {
		this.notify("Clearing joined users");
		this.joinedUserIds = [this.ownerId];
	}

	resetPrefs(): void {
		this.notify("Resetting thread preferences");
		this.prefs = Thread.defaultPrefs;
	}

	resetAll(): void {
		this.notify("Resetting thread");
		this.clearMessages();
		this.clearJoinedUsers();
		this.resetPrefs();
		this.name = this.name ?? Thread.defaultThreadName
		this.appVersion = getAppVersion();
	}

	notify(message: string): void {
		smartNotify(message, `Thread: "${this.name}" (${this.id})`);
	}
}
