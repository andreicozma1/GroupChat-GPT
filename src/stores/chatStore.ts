import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {rHtmlTagWithContent} from "src/util/Utils";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {getMessageHistory} from "src/util/chat/MessageHistory";
import {Prompt} from "src/util/prompt/Prompt";
import {User, UserTypes} from "src/util/users/User";
import {UserHuman} from "src/util/users/UserHuman";
import {assistantFilter, UserCodex, UserCoordinator, UserDalle, UserDavinci,} from "src/util/users/Assistant";
import {UserCodexGen, UserDalleGen} from "src/util/users/Helpers";
import {ChatMessage} from "src/util/chat/ChatMessage";
import {ChatThread} from "src/util/chat/ChatThread";

const localStorageKey = "data";

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
	userData: {
		usersMap: Record<string, User>;
		myUserId: string;
	};
	threadData: {
		threadsMap: Record<string, ChatThread>;
		activeThreadId: string | undefined;
		defaultThreadName: string;
	};
	cachedResponses: Record<string, any>;
}

const getDefaultUsersState = (): ChatStoreState["userData"] => {
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
		myUserId: "human",
	};
};

const getDefaultThreadState = (): ChatStoreState["threadData"] => {
	return {
		threadsMap: {},
		activeThreadId: undefined,
		defaultThreadName: "General",
	};
};

export const useChatStore = defineStore("counter", {
	state: (): ChatStoreState => ({
		userData: getDefaultUsersState(),
		threadData: getDefaultThreadState(),
		cachedResponses: {},
		...JSON.parse(LocalStorage.getItem(localStorageKey) || "{}"),
	}),
	getters: {
		/**************************************************************************************************************/
		// Users
		/**************************************************************************************************************/
		myUserId(state): string {
			return state.userData.myUserId;
		},
		usersMap(state): Record<string, User> {
			return state.userData.usersMap;
		},
		usersArray(): User[] {
			return Object.values(this.usersMap);
		},
		usersAssistantsArray(): User[] {
			return this.usersArray.filter(assistantFilter);
		},
		/**************************************************************************************************************/
		// Threads
		/**************************************************************************************************************/
		activeThreadId(state): string | undefined {
			return state.threadData.activeThreadId;
		},
		threadsMap(state): Record<string, ChatThread> {
			return state.threadData.threadsMap;
		},
	},
	actions: {
		/**************************************************************************************************************/
		// Users
		/**************************************************************************************************************/
		registerUser(user: User) {
			console.warn("registerUser:", user);
			smartNotify(`Registering user: "${user.id}"...`);
			this.usersMap[user.id] = user;
			return user
		},
		getUserById(id: string): User {
			console.warn("getUserById:", id);
			const user = this.usersMap[id]
			if (!user) smartNotify(`Error: User not found: ${id}`);
			return user
		},
		getMyUser(): User {
			console.warn("getMyUser");
			const user = this.getUserById(this.myUserId);
			if (!user) return this.registerUser(new UserHuman(this.myUserId));
			return user
		},
		/**************************************************************************************************************/
		// Threads
		/**************************************************************************************************************/
		registerThread(thread: ChatThread) {
			console.warn("registerThread:", thread);
			smartNotify(`Registering new thread: "${thread.id}"...`);
			// if the human isnt in the thread, add them
			thread.addUser(this.getMyUser());
			// add the default assistants to the thread
			this.usersAssistantsArray.filter((u) => u.defaultJoin).forEach((u) => thread.addUser(u));
			this.threadsMap[thread.id] = thread;
			// set the new thread as the active thread
			this.threadData.activeThreadId = thread.id;
			return thread
		},
		getThreadById(key: string) {
			console.warn("getThreadById:", key);
			const thread = this.threadsMap[key];
			const joinedAssistants = thread.getJoinedUsers(this.getUserById).filter(assistantFilter);
			if (joinedAssistants.length === 0) {
				smartNotify("Warning: There are no assistants in this thread!",
					"You can add assistants in the thread preferences menu.");
			}
			return thread;
		},
		getActiveThread(): ChatThread {
			console.warn("=".repeat(60));
			console.warn("getActiveThread");
			const activeThreadId = this.activeThreadId;
			if (!activeThreadId) return this.registerThread(new ChatThread())
			return this.getThreadById(activeThreadId);
		},
		/**************************************************************************************************************/
		// Messages
		/**************************************************************************************************************/
		createMessageFromUserId(id: string): ChatMessage {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: User = this.getUserById(id);
			return new ChatMessage(cfg);
		},
		deleteMessage(messageId: string, silent = false): void {
			const thread = this.getActiveThread();
			if (!thread.messageIdMap[messageId]) {
				if (!silent) {
					smartNotify("An error occurred while deleting the message.");
				}
				console.error(
					`An error occurred while deleting the message: ${messageId}`
				);
				return;
			}
			const followUpIds = thread.messageIdMap[messageId].followupMsgIds;
			if (followUpIds) {
				for (let i = 0; i < followUpIds.length; i++) {
					this.deleteMessage(followUpIds[i], true);
				}
			}
			delete thread.messageIdMap[messageId];
			this.saveData();
			smartNotify("Successfully deleted message.");
		},
		async handleUserMessage(message: ChatMessage) {
			const user: User = this.getUserById(message.userId);
			const thread: ChatThread = this.getActiveThread();
			thread.messageIdMap[message.id] = message;
			this.saveData();

			console.warn("*".repeat(40));

			console.log("handleUserMessage->user:", user);
			console.log("handleUserMessage->message:", message);

			message.loading = true;

			if (message.followupMsgIds.length > 0) {
				message.followupMsgIds.forEach((id: string) => {
					this.deleteMessage(id, true);
				});
				message.followupMsgIds = [];
			}

			if (user.type !== UserTypes.HUMAN) {
				const msgHistIds = message.apiResponse?.prompt?.messagesCtxIds;
				let ignoreCache =
					user.shouldIgnoreCache === undefined ? false : user.shouldIgnoreCache;
				let msgHist;
				if (!msgHistIds) {
					// First-time generation
					msgHist = getMessageHistory(thread, {
						hiddenUserIds:
							user.id !== this.userData.usersMap.coordinator.id
								? [this.userData.usersMap.coordinator.id]
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
				const nextUsers = [];
				const isDirectMention = text.match(/@([a-zA-Z0-9_]+)/g);
				const joinedUserIds = thread.getJoinedUsers(this.getUserById).map(u => u.id)
				if (isDirectMention) {
					// remove the @ and only keep valid usernames
					nextUsers.push(
						...isDirectMention
							.map((m: string) => m.slice(1))
							.filter((m: string) => joinedUserIds.includes(m))
					);
				}
				const prompts = text.match(rHtmlTagWithContent);

				console.warn(text);
				console.warn(prompts);
				if (prompts) {
					nextUsers.push(
						...prompts
							.map((p: string) => p.slice(1, p.indexOf(">")))
							.filter((m: string) => {
								const isInChat = joinedUserIds.includes(m);
								if (!isInChat)
									smartNotify(`User ${m} is not a member of this chat thread.`);
								return isInChat;
							})
					);
				}

				if (nextUsers.length > 0) return nextUsers;
				return [];
			});

			if (user.id === this.getMyUser().id && followups.length === 0) {
				followups.push(this.userData.usersMap.coordinator.id);
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
			this.saveData();
		},
		/**************************************************************************************************************/
		// API Responses
		/**************************************************************************************************************/
		getCachedResponseFromPrompt(prompt: Prompt): any {
			return this.cachedResponses[prompt.hash];
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
				this.getActiveThread().name,
				this.getMyUser().name,
				user,
				this.usersMap,
				msgHist
			);
			console.log("generate->prompt:", prompt);
			console.log("generate->prompt.hash:", prompt.hash);
			console.log("generate->prompt.text:");
			console.log(prompt.text);

			// if we already have a response for this prompt, return it
			let response;
			let cached;
			try {
				if (!ignoreCache && this.getCachedResponseFromPrompt(prompt)) {
					response = this.getCachedResponseFromPrompt(prompt);
					cached = true;
				} else {
					response = await makeApiRequest(user.apiReqConfig, prompt.text);
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
			this.cachedResponses[prompt.hash] = response;

			return {
				cached: cached,
				errorMsg: undefined,
				prompt: prompt,
				data: this.cachedResponses[prompt.hash].data,
			};
		},
		/**************************************************************************************************************/
		/* DATA & STORAGE
		/**************************************************************************************************************/
		saveData() {
			// TODO: Make this optional with a preference
			smartNotify("Saving data...");
			LocalStorage.set(localStorageKey, JSON.stringify(this.$state));
		},
		clearAllData() {
			// clear whole local storage and reload
			smartNotify("Clearing all app data...");
			LocalStorage.clear();
			location.reload();
		},
		resetCachedResponses() {
			smartNotify(`Clearing cached responses`);
			this.cachedResponses = {};
			this.saveData();
			return this.cachedResponses;
		},
		resetAllThreads() {
			smartNotify(`Resetting all threads`);
			this.threadData = getDefaultThreadState();
			this.saveData();
			return this.threadData;
		},
		resetAllUsers() {
			smartNotify(`Resetting all users`);
			this.userData = getDefaultUsersState();
			this.saveData();
			return this.userData;
		},

	},
});
