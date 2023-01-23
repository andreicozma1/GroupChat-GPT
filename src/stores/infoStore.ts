import {defineStore} from "pinia";
import {getTextHash} from "src/util/TextUtils";


export interface InfoMessage {
	id: string;
	title: string;
	caption?: string;
	dateUpdated: Date;
}

interface InfoState {
	messages: { [key: string]: InfoMessage }
}

export const useInfoStore = defineStore("info", {
	state: (): InfoState => ({
		messages: {},
	}),
	getters: {
		getMessages(): InfoMessage[] {
			const msgs = Object.values(this.messages);
			msgs.sort((a, b) => {
						  return b.dateUpdated.getTime() - a.dateUpdated.getTime();
					  }
			);
			return msgs;
		},
		getLastMessage(): InfoMessage | undefined {
			return this.getMessages[0];
		},
		hasMessages(): boolean {
			return Object.keys(this.messages).length > 0;
		}
	},
	actions: {
		createMessage(title: string, caption?: string) {
			const id = getTextHash(title + caption);
			const msg = {
				id: id,
				title: title,
				caption: caption || "",
				dateUpdated: new Date(),
			}
			this.messages[id] = msg;
			return msg;
		},
		updateMessage(message: InfoMessage) {
			this.messages[message.id] = {
				...message,
				dateUpdated: new Date(),
			}
		},
		resetInfo() {
			this.messages = {};
		},
		removeMessage(message: InfoMessage) {
			this.removeMessageById(message.id);
		},
		removeMessageById(id: string) {
			delete this.messages[id];
		}
	},
});
