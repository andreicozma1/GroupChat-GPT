import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {smartNotify} from "src/util/SmartNotify";
import {makeCompletion} from "src/util/openai/ApiReq";
import {UserPrompt} from "src/util/prompt/UserPrompt";
import {parseDate} from "src/util/DateUtils";
import StateGlobalStore from "src/util/states/StateGlobalStore";
import StateThreads from "src/util/states/StateThreads";
import StateUsers from "src/util/states/StateUsers";
import {User, UserTypes} from "src/util/chat/User";
import {Thread} from "src/util/chat/Thread";
import {UserHuman} from "src/util/chat/UserHuman";
import {assistantFilter} from "src/util/chat/assistants/UserChattingAssistant";
import {Message} from "src/util/chat/Message";
import {parseMessagesHistory} from "src/util/chat/MessageHistory";
import StatePrefs from "src/util/states/StatePrefs";
import {createRegexHtmlTagWithContent, validUserIdPattern} from "src/util/RegexUtils";

export interface ApiResponse {
	data: any;
	cacheIgnored: boolean;
	fromCache?: boolean;
	error?: any;
}

interface FollowUp {
	userId: string,
	ctxMsgId: string,
	promptText?: string
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
		getUserById(id: string, verbose = true): User | undefined {
			// console.warn("getUserById:", id);
			if (this.usersMap[id] && !(this.usersMap[id] instanceof User)) {
				this.usersMap[id] = Object.assign(
					User.prototype,
					this.usersMap[id]
				);
			}
			if (!this.usersMap[id] && verbose) {
				smartNotify('User not found', id);
			}
			return this.usersMap[id];
		},
		getMyUser(): User {
			console.warn("getMyUser");
			let user = this.getUserById(this.myUserId, false)
			if (!user) {
				user = this.registerUser(new UserHuman(this.myUserId), false);
			}
			return user;
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
			if (this.threadsMap[key] && !(this.threadsMap[key] instanceof Thread)) {
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
			if (!this.activeThreadId) {
				return this.registerThread(new Thread(this.myUserId), false) as Thread;
			}
			return this.getThreadById(this.activeThreadId) as Thread;
		},
		getActiveThreadUsers(): User[] {
			const thread = this.getActiveThread();
			const users = thread.joinedUserIds
								.map((id) => this.getUserById(id))
								.filter((u: User | undefined) => u !== undefined) as User[];
			const joinedAssistants = users.filter(assistantFilter);
			if (joinedAssistants.length > 1 && !joinedAssistants.map((u) => u.id)
																.includes(this.userData.usersMap.coordinator.id)) {
				thread.addUser(this.userData.usersMap.coordinator);
				smartNotify("Thread has multiple assistants",
							"Adding Coordinator Assistant to help manage the conversation");
			}
			return users;
		},
		/**************************************************************************************************************/
		// Messages
		/**************************************************************************************************************/

		async handleUserMessage(message: Message, followUp?: FollowUp) {
			const user: User | undefined = this.getUserById(message.userId);
			if (!user) {
				smartNotify(`User ${message.userId} does not exist.`);
				return;
			}
			const thread: Thread = this.getActiveThread();
			const threadUsers: User[] = this.getActiveThreadUsers();
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
				message.textSnippets = []
				message.imageUrls = []
				message.prompt = new UserPrompt(user)
				if (followUp && followUp.promptText) {
					message.prompt.messageContextIds = [followUp.ctxMsgId];
					message.prompt.fromText(followUp.promptText);
				} else {
					let messages: Message[];
					messages = thread.getMessagesArray();
					messages = parseMessagesHistory(messages, {
						excludeUserIds:
							user.id !== this.userData.usersMap.coordinator.id
							? [this.userData.usersMap.coordinator.id]
							: [],
						maxMessages: 10,
						maxDate: message.dateCreated,
						excludeLoading: false,
						excludeNoText: true,
						excludeIgnored: true,
					});
					console.error("messages:", messages);
					message.prompt.fromThread(thread.name, threadUsers, messages);
				}

				message.loading = true;
				const response = await this.handleApiRequest(
					message.prompt,
					message.apiResponse !== undefined
				);
				message.parseApiResponse(response);
			}

			let followups: FollowUp[] = message.textSnippets.flatMap((text: string) => {
				const fups: FollowUp[] = [];

				const directMention = text.matchAll(new RegExp(`@(${validUserIdPattern})`, "gi"));
				for (const match of directMention) {
					console.log("followups->directMention:", match);
					fups.push({
								  userId: match[1],
								  ctxMsgId: message.id,
								  promptText: undefined
							  });
				}

				const promptedFollowup = text.matchAll(createRegexHtmlTagWithContent())
				for (const match of promptedFollowup) {
					console.log("followups->prompt:", match);
					fups.push({
								  userId: match[1],
								  ctxMsgId: message.id,
								  promptText: match[2]
							  });
				}

				return fups;
			});

			if (followups.length > 0) {

				followups = followups.filter((f: FollowUp) => {
					const uid = f.userId
					if (uid === user.id) {
						return false;
					}
					// const isInChat = joinedUserIds.includes(uid);
					// if (!isInChat) {
					// 	smartNotify(`User ${uid} is not a member of this chat thread.`);
					// }
					// return isInChat;
					return true;
				});
			} else if (user.type === UserTypes.HUMAN) {
				followups = [
					{
						userId: this.userData.usersMap.coordinator.id,
						ctxMsgId: message.id,
						promptText: undefined
					},
				];
			}

			console.warn("handleUserMessage->followupActors:", followups);

			for (const fup of followups) {
				const nextUserId = fup.userId.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim().toLowerCase();
				if (!thread.joinedUserIds.includes(nextUserId)) {
					smartNotify(`User ${nextUserId} is not a member of this chat thread.`);
					continue;
				}
				const nextUser: User | undefined = this.getUserById(nextUserId);
				const nextMsg: Message = new Message(nextUser);
				message.followupMsgIds.push(nextMsg.id);
				// increment the DateCreated from the previous message
				nextMsg.dateCreated = new Date(
					parseDate(message.dateCreated).getTime() + 250
				);

				if (thread.prefs.orderedResponses) {
					await this.handleUserMessage(nextMsg, fup);
				} else {
					this.handleUserMessage(nextMsg, fup);
				}
			}
			thread.addMessage(message);
			this.saveState(false);
		},
		/**************************************************************************************************************/
		// API Responses
		/**************************************************************************************************************/
		getPromptResponse(prompt: UserPrompt): any {
			console.log("getCachedResponseFromPrompt->prompt:", prompt);
			return this.cachedResponses[prompt.hash];
		},
		async handleApiRequest(
			prompt: UserPrompt,
			ignoreCache = false,
			debug = false
		): Promise<ApiResponse> {
			ignoreCache = prompt.promptUser.alwaysIgnoreCache || ignoreCache;
			console.warn("-".repeat(20));
			console.log("generate->ignoreCache:", ignoreCache);
			console.log("generate->debug:", debug);
			console.log("generate->prompt:", prompt);
			console.error("generate->prompt.text:");
			console.error(prompt.finalPromptText);
			// if we already have a response for this prompt, return it
			const result: ApiResponse = {
				cacheIgnored: ignoreCache,
				fromCache: undefined,
				data: undefined
			}
			try {
				result.fromCache = true
				let response = this.getPromptResponse(prompt);
				if (ignoreCache || !response) {
					result.fromCache = false;
					response = await makeCompletion(
						prompt.promptUser.apiReqConfig,
						prompt.finalPromptText,
						debug
					);
					this.cachedResponses[prompt.hash] = response;
				}
				result.data = response.data;
			} catch (error: any) {
				console.error(error);
				if (error.stack) {
					console.error(error.stack);
				}
				result.error = error;
			}

			return result;
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
			location.reload();
			return this.cachedResponses;
		},
		resetPrefs() {
			smartNotify(`Resetting preferences...`);
			this.prefs = StatePrefs.getDefault()
			this.saveState();
			location.reload();
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
			location.reload();
			return this.threadData;
		},
		resetAllUsers() {
			smartNotify(`Resetting all users data...`);
			this.userData = StateUsers.getDefault();
			this.saveState();
			location.reload();
			return this.userData;
		},
	},
});
