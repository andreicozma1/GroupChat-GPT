import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {rHtmlTagWithContent} from "src/util/Utils";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {parseMessageHistory} from "src/util/chat/MessageHistory";
import {Prompt} from "src/util/prompt/Prompt";
import {User, UserTypes} from "src/util/users/User";
import {UserHuman} from "src/util/users/UserHuman";
import {assistantFilter, UserCodex, UserCoordinator, UserDalle, UserDavinci,} from "src/util/users/Assistant";
import {UserCodexGen, UserDalleGen} from "src/util/users/Helpers";
import {ChatMessage} from "src/util/chat/ChatMessage";
import {ChatThread} from "src/util/chat/ChatThread";
import {parseDate} from "src/util/DateUtils";

const localStorageKey = "data";

export interface ApiResponse {
	cached: boolean;
	errorMsg: string | undefined;
	prompt: Prompt;
	data: any;
}

class ChatStoreState {

	userData: {
		usersMap: Record<string, User>;
		myUserId: string;
	} = ChatStoreState.getDefaultUsersData();
	threadData: {
		threadsMap: Record<string, ChatThread>;
		activeThreadId: string | undefined;
		defaultThreadName: string;
	} = ChatStoreState.getDefaultThreadsData();
	cachedResponses: Record<string, any> = {};

	reset() {
		this.userData = ChatStoreState.getDefaultUsersData();
		this.threadData = ChatStoreState.getDefaultThreadsData();
		this.cachedResponses = {};
	}

	public static getDefaultUsersData() {
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
		}
	}

	public static getDefaultThreadsData() {
		return {
			threadsMap: {},
			activeThreadId: undefined,
			defaultThreadName: "General",
		};
	}
}


const getLocalStorageData = (): ChatStoreState => {
	const item: string | null = LocalStorage.getItem(localStorageKey)
	const state = new ChatStoreState()
	if (!item) return state;
	Object.assign(state, JSON.parse(item));
	return state;
}

export const useChatStore = defineStore("counter", {
	state: (): ChatStoreState => (getLocalStorageData()),
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
			this.saveData()
			return this.usersMap[user.id]
		},
		getUserById(id: string): User {
			// console.warn("getUserById:", id);
			if (!this.usersMap[id]) smartNotify(`User not found: ${id}`);
			return this.usersMap[id]
		},
		getMyUser(): User {
			console.warn("getMyUser");
			if (!this.getUserById(this.myUserId)) return this.registerUser(new UserHuman(this.myUserId));
			return this.getUserById(this.myUserId);
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
			this.saveData()
			return this.threadsMap[thread.id]
		},
		getThreadById(key: string) {
			console.warn("getThreadById:", key);
			if (!(this.threadsMap[key] instanceof ChatThread)) {
				this.threadsMap[key] = Object.assign(ChatThread.prototype, this.threadsMap[key]);
			}
			const joinedAssistants = this.threadsMap[key].getJoinedUsers(this.getUserById).filter(assistantFilter);
			if (joinedAssistants.length === 0) {
				smartNotify("Warning: There are no assistants in this thread!",
					"You can add assistants in the thread preferences menu.");
			}
			return this.threadsMap[key];
		},
		getActiveThread(): ChatThread {
			console.warn("=".repeat(60));
			console.warn("getActiveThread");
			if (!this.activeThreadId) return this.registerThread(new ChatThread()) as ChatThread;
			return this.getThreadById(this.activeThreadId) as ChatThread;
		},
		/**************************************************************************************************************/
		// Messages
		/**************************************************************************************************************/
		createMessageFromUserId(id: string): ChatMessage {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: User = this.getUserById(id);
			return new ChatMessage(cfg);
		},

		async handleUserMessage(message: ChatMessage) {
			const user: User = this.getUserById(message.userId);
			const thread: ChatThread = this.getActiveThread();
			thread.addMessage(message);
			console.warn("*".repeat(40));

			console.log("handleUserMessage->user:", user);
			console.log("handleUserMessage->message:", message);

			if (message.followupMsgIds.length > 0) {
				message.followupMsgIds.forEach((id: string) => {
					thread.deleteMessage(id);
				});
				message.followupMsgIds = [];
			}

			if (user.type !== UserTypes.HUMAN) {
				let messages: ChatMessage[];
				let ignoreCache = user.shouldIgnoreCache === undefined ? false : user.shouldIgnoreCache;

				const prevMsgContextIds = message.apiResponse?.prompt?.messagesCtxIds;
				if (prevMsgContextIds) {
					// Re-generation from specified context
					messages = thread.getMessageArrayFromIds(prevMsgContextIds)
					// TODO: This will end up with less messages than expected if there are any undefined messages
					ignoreCache = true;
				} else {
					messages = thread.getMessageArray()
				}
				messages = parseMessageHistory(messages, {
					hiddenUserIds:
						user.id !== this.userData.usersMap.coordinator.id
							? [this.userData.usersMap.coordinator.id]
							: [],
					maxMessages: 10,
					maxDate: message.dateCreated,
					excludeLoading: true,
				});
				message.loading = true;
				const response = await this.generate(user, messages, thread, ignoreCache);
				message.parseApiResponse(response);
			}

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
				// increment the DateCreated from the previous message
				// nextMsg.dateCreated = message.dateCreated;
				nextMsg.dateCreated = new Date(parseDate(message.dateCreated).getTime() + 1);
				if (thread.prefs.orderedResponses) {
					await this.handleUserMessage(nextMsg);
				} else {
					this.handleUserMessage(nextMsg);
				}
			}
			thread.addMessage(message);
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
			thread: ChatThread,
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
				thread.name,
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
			this.threadData = ChatStoreState.getDefaultThreadsData()
			this.saveData();
			return this.threadData;
		},
		resetAllUsers() {
			smartNotify(`Resetting all users`);
			this.userData = ChatStoreState.getDefaultUsersData()
			this.saveData();
			return this.userData;
		},

	},
});
