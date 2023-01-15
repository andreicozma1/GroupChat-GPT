import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {getAppVersion, rHtmlTagWithContent} from "src/util/Utils";
import {ChatThread,} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {getMessageHistory} from "src/util/chat/ChatUtils";
import {Prompt} from "src/util/prompt/Prompt";
import {User, UserTypes} from "src/util/users/User";
import {UserHuman} from "src/util/users/UserHuman";
import {UserCodex, UserCoordinator, UserDalle, UserDavinci,} from "src/util/users/Assistant";
import {UserCodexGen, UserDalleGen} from "src/util/users/Helpers";
import {ChatMessage} from "src/util/chat/ChatMessage";

const localStorageKey = "data";
const defaultHumanUserId = "human";
const defaultThreadId = "general";
const defaultAssistants = ["davinci", "dalle", "codex"];


export interface ApiResponse {
	cached: boolean;
	errorMsg: string | undefined;
	prompt: Prompt;
	data: any;
}

// const DefaultThread = {
// 	messageIdMap: {},
// 	appVersion: getAppVersion(),
// 	joinedUserIds: [],
// 	prefs: {
// 		hiddenUserIds: [],
// 		dontShowMessagesHiddenInPrompts: false,
// 		orderedResponses: true,
// 	},
// };

interface ChatStoreState {
	user: {
		usersMap: Record<string, User>;
		humanUserId: string;
	},
	thread: {
		threadsMap: Record<string, ChatThread>;
		currentThreadId: string;
	},
	cachedResponses: Record<string, any>;
}

const getDefaultUsersState = (): ChatStoreState["user"] => {
	return {
		usersMap: {
			coordinator: new UserCoordinator(),
			davinci: new UserDavinci(),
			// DALL-E
			dalle: new UserDalle(),
			dalle_gen: new UserDalleGen(),
			// Codex
			codex: new UserCodex(),
			codex_gen: new UserCodexGen(),
		},
		humanUserId: defaultHumanUserId,
	}
}

const getDefaultThreadState = (): ChatStoreState["thread"] => {
	return {
		threadsMap: {},
		currentThreadId: defaultThreadId,
	}
}

const getDefaultThread = (): ChatThread => {
	return {
		id: defaultThreadId,
		name: "New Thread",
		messageIdMap: {},
		appVersion: getAppVersion(),
		joinedUserIds: [],
		prefs: {
			hiddenUserIds: [],
			dontShowMessagesHiddenInPrompts: false,
			orderedResponses: true,
		}
	}
}

export const useChatStore = defineStore("counter", {
	state: (): ChatStoreState => ({
		user: getDefaultUsersState(),
		thread: getDefaultThreadState(),
		cachedResponses: {},
		...LocalStorage.getItem(localStorageKey),
	}),
	getters: {
		getUsersMap(state): Record<string, User> {
			return state.user.usersMap;
		},
		getUserConfig() {
			return (key: string) => {
				if (key === this.user.humanUserId && !this.getUsersMap[key]) {
					this.getUsersMap[key] = new UserHuman(this.user.humanUserId);
				}
				return this.getUsersMap[key];
			}
		},
		getHumanUserConfig(): User {
			return this.getUserConfig(this.user.humanUserId);
		},
		getThreadsMap(state): Record<string, ChatThread> {
			return state.thread.threadsMap;
		},
		getThreadConfig() {
			return (key: string) => {
				if (!this.getThreadsMap[key]) {
					this.thread.threadsMap[key] = {
						...getDefaultThread(),
						id: key,
					}
				}
				const thread = this.getThreadsMap[key];
				// if the human isnt in the thread, add them
				if (!thread.joinedUserIds.includes(this.getHumanUserConfig.id)) {
					smartNotify("Joining thread: " + thread.name);
					thread.joinedUserIds.push(this.getHumanUserConfig.id);
				}
				// if the number of assistants in the thread is 0, add the default assistants
				const users = thread.joinedUserIds.map((id) => this.getUserConfig(id));
				const assistants = users.filter(
					(user: User) => user.type === UserTypes.ASSISTANT || user.type === UserTypes.HELPER
				);

				if (assistants.length === 0) {
					smartNotify(
						`Adding default assistants: ${defaultAssistants.join(", ")}`
					);
					thread.joinedUserIds.push(...defaultAssistants);
				}
				for (const id of thread.joinedUserIds) {
					thread.joinedUserIds.push(...this.getUserConfig(id).requiresUserIds);
				}
				thread.joinedUserIds = Array.from(new Set(thread.joinedUserIds));
				console.log("getThread:", {...thread});
				// this.thread.threadsMap[thread.id] = thread;
				return thread;
			}
		},
		getCurrentThread(): ChatThread {
			return this.getThreadConfig(this.thread.currentThreadId);
		},
		getCachedResponses(state) {
			return state.cachedResponses;
		},
		getCachedResponseFromPrompt(): (prompt: Prompt) => any {
			return (prompt: Prompt) => this.getCachedResponses[prompt.hash];
		},
	},
	actions: {
		saveData() {
			// TODO: Make this optional with a preference
			smartNotify("Saving data...");
			LocalStorage.set(localStorageKey, this.$state);
		},
		clearAllData() {
			// clear whole local storage and reload
			smartNotify("Clearing all app data...");
			LocalStorage.clear();
			location.reload();
		},
		clearCurrentThreadMessages() {
			const thread = this.getCurrentThread;
			smartNotify(`Clearing thread messages: ${thread.id}`);
			this.thread.threadsMap[thread.id].messageIdMap = {};
			this.saveData();
			return this.thread.threadsMap[thread.id].messageIdMap;
		},
		clearCachedResponses() {
			smartNotify(`Clearing cached responses`);
			this.cachedResponses = {};
			this.saveData();
			return this.cachedResponses;
		},
		resetCurrentThreadPrefs() {
			const thread = this.getCurrentThread;
			smartNotify(`Resetting thread prefs: ${thread.id}`);
			this.thread.threadsMap[thread.id].prefs = getDefaultThread().prefs
			this.saveData();
			return this.thread.threadsMap[thread.id].prefs;
		},
		resetCurrentThread() {
			const thread = this.getCurrentThread;
			smartNotify(`Resetting thread: ${thread.id}`);
			this.thread.threadsMap[thread.id] = getDefaultThread();
			this.saveData();
			return this.thread.threadsMap[thread.id];
		},
		resetAllThreads() {
			smartNotify(`Resetting all threads`);
			this.thread = getDefaultThreadState();
			this.saveData();
			return this.thread
		},
		resetAllUsers() {
			smartNotify(`Resetting all users`);
			this.user = getDefaultUsersState();
			this.saveData();
			return this.user
		},

		createMessageFromUserId(id: string): ChatMessage {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: User = this.getUserConfig(id);
			return new ChatMessage(cfg);
		},
		deleteMessage(messageId: string, silent = false): void {
			const thread = this.getCurrentThread;
			if (!thread.messageIdMap[messageId]) {
				if (!silent) {
					smartNotify("An error occurred while deleting the message.");
				}
				console.error(
					`An error occurred while deleting the message: ${messageId}`
				);
				return;
			}
			const followUpIds =
				thread.messageIdMap[messageId]
					.followupMsgIds;
			if (followUpIds) {
				for (let i = 0; i < followUpIds.length; i++) {
					this.deleteMessage(followUpIds[i], true);
				}
			}
			delete thread.messageIdMap[messageId];
			this.saveData();
			smartNotify("Successfully deleted message.");
		},
		async generate(
			user: User,
			msgHist: ChatMessage[],
			ignoreCache?: boolean
		): Promise<ApiResponse> {
			ignoreCache = ignoreCache ?? false;
			console.warn("-".repeat(20));
			console.log("generate->actor:", user);
			console.log("generate->ignoreCache:", ignoreCache);

			msgHist = msgHist.filter((m: ChatMessage) => !m.isIgnored);
			// const contextIds: string[] = ;
			// console.log("generate->contextIds:", contextIds);

			for (let i = 0; i < msgHist.length; i++) {
				console.log("----------------");
				console.log(
					`msgHist[${i}] -> (${msgHist[i].textSnippets.length} texts & ${msgHist[i].imageUrls.length} images)`,
					[...msgHist[i].textSnippets],
					{...msgHist[i]}
				);
			}

			const prompt = new Prompt(
				// this.currentThreadName,
				// this.humanUserName,
				this.getCurrentThread.name,
				this.getHumanUserConfig.name,
				user,
				this.getUsersMap,
				msgHist
			);
			console.log("generate->prompt:", prompt);
			console.log("generate->prompt.hash:", prompt.hash);
			console.log("generate->prompt.text:");
			console.log(prompt.text);

			// if we already have a completion for this prompt, return it
			let completion;
			let cached;
			try {
				if (!ignoreCache && this.getCachedResponseFromPrompt(prompt)) {
					completion = this.getCachedResponseFromPrompt(prompt);
					cached = true;
				} else {
					completion = await makeApiRequest(user.apiReqConfig, prompt.text);
					cached = false;
				}
			} catch (error: any) {
				console.error(error);
				if (error.stack) console.error(error.stack);
				let errorMsg = "";
				if (error.message) errorMsg += error.message;
				if (error.response) {
					errorMsg += "\n" + "Status: " + error.response.status;
					errorMsg +=
						"\n" + "Data: " + JSON.stringify(error.response.data, null, 4);
				}
				return {
					cached: false,
					errorMsg: errorMsg,
					prompt: prompt,
					data: undefined,
				};
			}
			this.cachedResponses[prompt.hash] = {...completion};

			return {
				cached: cached,
				errorMsg: undefined,
				prompt: prompt,
				data: this.cachedResponses[prompt.hash],
			};
		},

		async handleUserMessage(message: ChatMessage) {
			const user: User = this.getUserConfig(message.userId);
			const thread: ChatThread = this.getCurrentThread;
			thread.messageIdMap[message.id] = message;
			this.saveData()

			console.warn("*".repeat(40));

			console.log("handleUserMessage->user:", user);
			console.log("handleUserMessage->message:", message);

			message.loading = true

			if (message.followupMsgIds.length > 0) {
				message.followupMsgIds.forEach((id: string) => {
					this.deleteMessage(id, true);
				});
				message.followupMsgIds = [];
			}

			if (user.type !== UserTypes.HUMAN) {
				const msgHistIds = message.apiResponse?.prompt?.messagesCtxIds
				let ignoreCache = user.shouldIgnoreCache === undefined ? false : user.shouldIgnoreCache;
				let msgHist;
				if (!msgHistIds) {
					// First-time generation
					msgHist = getMessageHistory(thread, {
						hiddenUserIds:
							user.id !== this.user.usersMap.coordinator.id
								? [this.user.usersMap.coordinator.id]
								: [],
						maxMessages: 10,
						maxDate: message.dateCreated,
						excludeLoading: true,
					});
				} else {
					// Re-generation from specified context
					msgHist = msgHistIds.map((id: string) => thread.messageIdMap[id]);
					// if there are any undefined messages, remove them
					msgHist = msgHist.filter((m: ChatMessage) => m !== undefined);
					// TODO: This will end up with less messages than expected if there are any undefined messages
					ignoreCache = true;
				}
				const response = await this.generate(user, msgHist, ignoreCache);
				message.parseApiResponse(response);
			}

			message.loading = false;

			const followups = message.textSnippets.flatMap((text: string) => {
				const next = []
				const directMention = text.match(/@([a-zA-Z0-9_]+)/g);
				if (directMention) {
					// remove the @ and only keep valid usernames
					next.push(...directMention.map((m: string) => m.slice(1)).filter((m: string) => thread.joinedUserIds.includes(m)))
				}
				const prompts = text.match(rHtmlTagWithContent);

				console.warn(text)
				console.warn(prompts)
				if (prompts) {
					next.push(...prompts.map((p: string) => p.slice(1, p.indexOf(">"))).filter((m: string) => {
						const isInChat = thread.joinedUserIds.includes(m)
						if (!isInChat) smartNotify(`User ${m} is not a member of this chat thread.`)
						return isInChat
					}))
				}

				if (next.length > 0) return next;
				return [];
			});

			if (user.id === this.getHumanUserConfig.id && followups.length === 0) {
				followups.push(this.user.usersMap.coordinator.id);
			}

			console.warn("handleUserMessage->followupActors:", followups);

			for (const nextKey of followups) {
				const nextMsg: ChatMessage = this.createMessageFromUserId(nextKey);
				message.followupMsgIds.push(nextMsg.id);
				nextMsg.dateCreated = message.dateCreated;
				if (thread.prefs.orderedResponses) {
					await this.handleUserMessage(nextMsg);
				} else {
					this.handleUserMessage(nextMsg);
				}
			}
			this.saveData()
		},
	},
});
