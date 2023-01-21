import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {rHtmlTagStart, rHtmlTagWithContent} from "src/util/Utils";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {AssistantPrompt} from "src/util/prompt/AssistantPrompt";
import {parseDate} from "src/util/DateUtils";
import StateGlobalStore from "src/util/states/StateGlobalStore";
import StateThreads from "src/util/states/StateThreads";
import StateUsers from "src/util/states/StateUsers";
import {User, UserTypes} from "src/util/chat/User";
import {Thread} from "src/util/chat/Thread";
import {UserHuman} from "src/util/chat/UserHuman";
import {assistantFilter} from "src/util/chat/assistants/UserAssistant";
import {Message} from "src/util/chat/Message";
import {parseMessagesHistory} from "src/util/chat/MessageHistory";
import StatePrefs from "src/util/states/StatePrefs";

export interface ApiResponse {
	fromCache: boolean;
	cacheIgnored: boolean;
	errorMsg: string | undefined;
	prompt: AssistantPrompt;
	data: any;
}

interface FollowUp {
	userId: string,
	prompt?: string
}

export const useChatStore = defineStore("chatStore", {
	state: () => StateGlobalStore.getState(),
	getters: {
		getDateCreated(state): Date {
			return parseDate(state.dateCreated);
		},
		getDateLastSaved(state): Date | undefined {
			return state.dateLastSaved ? parseDate(state.dateLastSaved) : undefined;
		},
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
		threadsMap(state): Record<string, Thread> {
			return state.threadData.threadsMap;
		},
	},
	actions: {
		/**************************************************************************************************************/
		// Users
		/**************************************************************************************************************/
		registerUser(user: User, verbose = true) {
			console.warn("registerUser:", user);
			smartNotify('Registering user...', `ID: ${user.id}`);
			this.usersMap[user.id] = user;
			this.saveState(verbose);
			return this.usersMap[user.id];
		},
		getUserById(id: string, verbose = true): User {
			// console.warn("getUserById:", id);
			if (!this.usersMap[id] && verbose) smartNotify('User not found', id);
			return this.usersMap[id];
		},
		getMyUser(): User {
			console.warn("getMyUser");
			if (!this.getUserById(this.myUserId, false))
				return this.registerUser(new UserHuman(this.myUserId), false);
			return this.getUserById(this.myUserId);
		},
		/**************************************************************************************************************/
		// Threads
		/**************************************************************************************************************/
		registerThread(thread: Thread, verbose = true) {
			console.warn("registerThread:", thread);
			smartNotify("Registering thread...", `ID: ${thread.id}`);
			// if the human isnt in the thread, add them
			thread.addUser(this.getMyUser());
			// add the default assistants to the thread
			this.usersAssistantsArray
				.filter((u) => u.defaultJoin)
				.forEach((u) => thread.addUser(u));
			this.threadsMap[thread.id] = thread;
			// set the new thread as the active thread
			this.threadData.activeThreadId = thread.id;
			this.saveState(verbose);
			return this.threadsMap[thread.id];
		},
		getThreadById(key: string) {
			console.warn("getThreadById:", key);
			if (!(this.threadsMap[key] instanceof Thread)) {
				this.threadsMap[key] = Object.assign(
					Thread.prototype,
					this.threadsMap[key]
				);
			}
			return this.threadsMap[key];
		},
		getActiveThread(): Thread {
			console.warn("=".repeat(60));
			console.warn("getActiveThread");
			if (!this.activeThreadId)
				return this.registerThread(new Thread(this.myUserId), false) as Thread;
			return this.getThreadById(this.activeThreadId) as Thread;
		},
		/**************************************************************************************************************/
		// Messages
		/**************************************************************************************************************/
		createMessageFromUserId(id: string): Message {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: User = this.getUserById(id);
			return new Message(cfg);
		},

		async handleUserMessage(message: Message, ignoreCache = false) {
			const user: User = this.getUserById(message.userId);
			const thread: Thread = this.getActiveThread();
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
				let messages: Message[];

				// const prevMsgContextIds = message.apiResponse?.prompt?.messagesCtxIds;
				// if (prevMsgContextIds) {
				// Re-generation from specified context
				// messages = thread.getMessagesArrayFromIds(prevMsgContextIds)
				// TODO: This will end up with less messages than expected if there are any undefined messages
				// } else {
				messages = thread.getMessagesArray();
				// }
				messages = parseMessagesHistory(messages, {
					excludeUserIds:
						user.id !== this.userData.usersMap.coordinator.id
							? [this.userData.usersMap.coordinator.id]
							: [],
					maxMessages: 10,
					maxDate: message.dateCreated,
					excludeLoading: true,
					excludeNoText: true,
					excludeIgnored: true,
				});
				message.loading = true;

				const response = await this.generate(
					user,
					messages,
					thread,
					ignoreCache
				);
				message.parseApiResponse(response);
			}


			let followups: FollowUp[] = message.textSnippets.flatMap((text: string) => {
				const fups: FollowUp[] = [];

				text.match(/@([a-zA-Z0-9_]+)/g)?.forEach((m: string) => {
					fups.push({
						userId: m.slice(1),
						prompt: undefined
					});
				});

				text.match(rHtmlTagWithContent)?.forEach((m: string) => {
					// get the name of the html tag
					const tag = m.match(rHtmlTagStart)?.[0].slice(1, -1);
					// get the content of the html tag
					if (tag) fups.push({
						userId: tag,
						prompt: undefined
					});
				});
				return fups;
			});

			if (followups.length > 0) {
				const joinedUserIds = thread
					.getJoinedUsers(this.getUserById)
					.map((u) => u.id);
				followups = followups.filter((f: FollowUp) => {
					const uid = f.userId
					const isInChat = joinedUserIds.includes(uid);
					if (!isInChat) smartNotify(`User ${uid} is not a member of this chat thread.`);
					return isInChat;
				});
			} else if (user.type === UserTypes.HUMAN) {
				followups = [
					{
						userId: this.userData.usersMap.coordinator.id,
						prompt: undefined
					},
				];
			}

			console.warn("handleUserMessage->followupActors:", followups);

			for (const fup of followups) {
				const uid = fup.userId;
				const nextMsg: Message = this.createMessageFromUserId(uid);
				message.followupMsgIds.push(nextMsg.id);
				// increment the DateCreated from the previous message
				// nextMsg.dateCreated = message.dateCreated;
				nextMsg.dateCreated = new Date(
					parseDate(message.dateCreated).getTime() + 1
				);
				if (thread.prefs.orderedResponses) {
					await this.handleUserMessage(nextMsg, ignoreCache);
				} else {
					this.handleUserMessage(nextMsg, ignoreCache);
				}
			}
			thread.addMessage(message);
			this.saveState(false);
		},
		/**************************************************************************************************************/
		// API Responses
		/**************************************************************************************************************/
		getCachedResponseFromPrompt(prompt: AssistantPrompt): any {
			console.log("getCachedResponseFromPrompt->prompt:", prompt);
			return this.cachedResponses[prompt.hash];
		},
		async generate(
			user: User,
			msgHist: Message[],
			thread: Thread,
			ignoreCache?: boolean
		): Promise<ApiResponse> {
			ignoreCache = ignoreCache ?? false;
			ignoreCache = user.alwaysIgnoreCache || ignoreCache;
			console.warn("-".repeat(20));
			console.log("generate->actor:", user);
			console.log("generate->ignoreCache:", ignoreCache);

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

			let prompt = undefined

			// if we already have a response for this prompt, return it
			let response;
			let cached;
			try {
				prompt = new AssistantPrompt(
					// this.currentThreadName,
					// this.humanUserName,
					thread.name,
					this.getMyUser().name,
					user,
					thread.getJoinedUsers(this.getUserById),
					msgHist
				);
				console.log("generate->prompt:", prompt);
				console.log("generate->prompt.hash:", prompt.hash);
				console.log("generate->prompt.text:");
				console.log(prompt.finalPromptText);

				const cachedResponse = this.getCachedResponseFromPrompt(prompt);
				if (!ignoreCache && cachedResponse) {
					response = cachedResponse;
					cached = true;
				} else {
					response = await makeApiRequest(
						user.apiReqConfig,
						prompt.finalPromptText
					);
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
					fromCache: false,
					cacheIgnored: ignoreCache,
					errorMsg: errorMsg,
					prompt: prompt,
					data: undefined,
				} as ApiResponse;
			}
			this.cachedResponses[prompt.hash] = response;

			return {
				fromCache: cached,
				cacheIgnored: ignoreCache,
				errorMsg: undefined,
				prompt: prompt,
				data: this.cachedResponses[prompt.hash].data,
			} as ApiResponse;
		},
		/**************************************************************************************************************/
		/* DATA & STORAGE
			/**************************************************************************************************************/
		saveState(verbose = true) {
			StateGlobalStore.saveState(this.$state, verbose);
		},
		clearAllData() {
			// clear whole local storage and reload
			smartNotify("Clearing all app data...");
			LocalStorage.clear();
			location.reload();
		},
		clearCachedResponses() {
			smartNotify(`Clearing complete cache...`);
			this.cachedResponses = {};
			this.saveState();
			return this.cachedResponses;
		},
		resetPrefs() {
			smartNotify(`Resetting preferences...`);
			this.prefs = StatePrefs.getDefault()
			this.saveState();
			return this.prefs;
		},
		resetActiveThread() {
			smartNotify(`Resetting active thread...`);
			const activeThread: Thread = this.getActiveThread();
			activeThread.resetAll();
			this.saveState();
			return activeThread;
		},
		clearActiveThreadMessages() {
			smartNotify(`Clearing active thread messages...`);
			const activeThread: Thread = this.getActiveThread();
			activeThread.clearMessages();
			this.saveState();
			return activeThread;
		},
		resetAllThreads() {
			smartNotify(`Resetting all threads data...`);
			this.threadData = StateThreads.getDefault();
			this.saveState();
			return this.threadData;
		},
		resetAllUsers() {
			smartNotify(`Resetting all users data...`);
			this.userData = StateUsers.getDefault();
			this.saveState();
			return this.userData;
		},
	},
});
