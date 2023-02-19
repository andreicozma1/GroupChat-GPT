import {getAppVersion} from "src/util/Utils";
import {v4 as uuidv4} from "uuid";
import {smartNotify} from "src/util/SmartNotify";
import {parseDate} from "src/util/DateUtils";
import {Message} from "src/util/chat/Message";
import {User} from "src/util/chat/users/User";

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
    public joinedUserIds: string[] = [];
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
        if (user.helper) {
            smartNotify(`Adding helper ${user.helper} to thread.`, `Requested by ${user.id}.`);
            this.joinedUserIds.push(user.helper);
        }
        this.joinedUserIds = Array.from(new Set(this.joinedUserIds));
    }

    getMessageIdMap(): { [key: string]: Message } {
        for (const messageId in this.messageIdMap) {
            if (!(this.messageIdMap[messageId] instanceof Message)) {
                this.messageIdMap[messageId] = Object.assign(
                    new Message(),
                    this.messageIdMap[messageId]
                );
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


    addMessage(message: Message): void {
        if (this.messageIdMap[message.id]) {
            delete this.messageIdMap[message.id];
        }
        this.messageIdMap[message.id] = message;
    }


    deleteMessage(messageId: string): void {
        if (!this.messageIdMap[messageId]) {
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
