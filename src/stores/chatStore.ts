import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {getAppVersion} from "src/util/Utils";
import {ChatMessage, ChatThread, ChatThreadPrefs, ChatUserTypes} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {createMessageFromUserConfig, getMessageHistory} from "src/util/chat/ChatUtils";
import {Prompt} from "src/util/prompt/Prompt";
import {User} from "src/util/users/User";
import {UserHuman} from "src/util/users/UserHuman";
import {UserCodex, UserCoordinator, UserDalle, UserDavinci} from "src/util/users/Assistant";
import {UserCodexGen, UserDalleGen} from "src/util/users/Helpers";

const localStorageKey = "data";
const defaultUserId = "humanUser"
const defaultUserName = "Human"
const defaultThreadId = "general"
const defaultThreadName = "General"
const defaultAssistants = ["davinci", "dalle", "codex"]

interface CachedResponse {
	contextIds: string[];
	responseData: any;
}

export interface PromptResponse {
	prompt?: Prompt;
	response?: CachedResponse;
	// TODO: Put these in a separate MessageContent interface and keep track of history
	textSnippets: string[];
	imageUrls: string[];

	errorMsg?: string;
	cached?: boolean;
}


const DefaultThread = {
	messageIdMap: {},
	appVersion: getAppVersion(),
	joinedUserIds: [],
	prefs: {
		hiddenUserIds: [],
		dontShowMessagesHiddenInPrompts: false,
		orderedResponses: true,
	}
}


// interface ChatStoreState {
// 	usersMap: Ref<Record<string, ChatUser>>;
// 	threadsMap: Ref<Record<string, ChatThread>>;
// 	humanUserId: Ref<string>;
// 	currentThread: Ref<string>;
// 	cachedResponses: Ref<Record<string, CachedResponse>>;
// }
interface ChatStoreState {
	usersMap: Record<string, User>;
	threadsMap: Record<string, ChatThread>;
	humanUserId: string;
	humanUserName: string;
	currentThreadId: string;
	currentThreadName: string;
	cachedResponses: Record<string, CachedResponse>;
}

export const useChatStore = defineStore("counter", {
	state: (): ChatStoreState => ({
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
		threadsMap: {},
		humanUserId: defaultUserId,
		humanUserName: defaultUserName,
		currentThreadId: defaultThreadId,
		currentThreadName: defaultThreadName,
		cachedResponses: {},
		...LocalStorage.getItem(localStorageKey),
	}),
	getters: {
		getUsersMap(state): Record<string, User> {
			return state.usersMap;
		},
		getUserConfig(): (key: string) => User {
			return (key: string) => {
				if (key === this.humanUserId && !this.getUsersMap[key]) {
					this.getUsersMap[key] = new UserHuman(this.humanUserId, this.humanUserName);
				}
				return this.getUsersMap[key];
			}
		},
		getHumanUserConfig(): User {
			console.log(this.getUsersMap)
			console.log(this.getUserConfig(this.humanUserId))
			console.log(this.humanUserId)
			return this.getUserConfig(this.humanUserId);
		},
		getActiveThread(state): ChatThread {
			let needsSave = false
			let thread = state.threadsMap[state.currentThreadId];
			if (!thread) {
				smartNotify("Creating new thread");
				thread = {...DefaultThread};
				needsSave = true;
			}

			// if the human isnt in the thread, add them
			if (!thread.joinedUserIds.includes(this.humanUserId)) {
				smartNotify("Joining thread: " + state.currentThreadId);
				thread.joinedUserIds.push(this.humanUserId);
				needsSave = true;
			}
			// if the number of assistants in the thread is 0, add the default assistants
			const users = thread.joinedUserIds.map(id => this.getUserConfig(id))
			const assistants = users.filter((user: User) => user.type === ChatUserTypes.ASSISTANT);

			if (assistants.length === 0) {
				smartNotify(`Adding default assistants: ${defaultAssistants.join(", ")}`);
				thread.joinedUserIds.push(...defaultAssistants);
				needsSave = true;
			}
			thread.joinedUserIds = Array.from(new Set(thread.joinedUserIds));
			console.log("getThread:", state.currentThreadId, {...thread});
			this.threadsMap[state.currentThreadId] = thread;
			return this.threadsMap[state.currentThreadId]
		},
		getCachedResponses(state) {
			return state.cachedResponses;
		},
		getCachedResponseFromPrompt(): (prompt: Prompt) => CachedResponse {
			return (prompt: Prompt) => this.getCachedResponses[prompt.hash];
		},
		getPromptResponse(): (prompt: Prompt) => PromptResponse {
			return (prompt: Prompt): PromptResponse => {
				const cache = this.getCachedResponseFromPrompt(prompt);
				const responseData = cache.responseData;
				const choices = responseData.choices;
				const text = choices
					?.flatMap((c: any) => {
						c = c.text
							.replace("<prompt>\n", "<prompt>")
							.replace("\n</prompt>", "</prompt>");
						c = c.trim();
						// if starts with ``` and ends with ``` then it's a code block
						if (c.startsWith("```") && c.endsWith("```")) return c;
						c = c.split("\n\n");
						return c;
					})
					.map((t: string) => t.trim())
					.filter((t: string) => t.length > 0);
				if (text) {
					console.warn("=> text:");
					text?.forEach((t: string) => console.log(t));
				}

				const images = responseData.data?.map((d: any) => d.url);
				if (images) {
					console.warn("=> images:");
					images?.forEach((i: string) => console.log(i));
				}

				return {
					cached: undefined,
					prompt: prompt,
					textSnippets: text,
					imageUrls: images,
					response: cache,
				};
			}
		}
	},
	actions: {
		saveData() {
			// TODO: Make this optional with a preference
			// smartNotify("Saving data...");
			LocalStorage.set(localStorageKey, this.$state);
		},
		clearAllData() {
			// clear whole local storage and reload
			smartNotify("Clearing all app data...");
			LocalStorage.clear();
			location.reload();
		},
		clearCurrentThreadMessages() {
			smartNotify(`Clearing thread messages: ${this.currentThreadId}`);
			this.threadsMap[this.currentThreadId].messageIdMap = {}
			this.saveData();
		},
		clearCachedResponses() {
			smartNotify(`Clearing cached responses`);
			this.cachedResponses = {};
			this.saveData();
		},
		resetCurrentThreadPrefs() {
			smartNotify(`Resetting thread prefs: ${this.currentThreadId}`);
			this.threadsMap[this.currentThreadId].prefs = {...DefaultThread.prefs} as ChatThreadPrefs;
			this.saveData();
		},
		resetCurrentThread() {
			smartNotify(`Resetting thread: ${this.currentThreadId}`);
			this.threadsMap[this.currentThreadId] = {...DefaultThread} as ChatThread;
			this.saveData();
		},
		resetAllThreads() {
			smartNotify(`Resetting all threads`);
			this.threadsMap = {}
			this.currentThreadId = defaultThreadId;
			this.saveData();
		},
		resetAllUsers() {
			smartNotify(`Resetting all users`);
			this.usersMap = {
				coordinator: new UserCoordinator(),
				davinci: new UserDavinci(),
				// DALL-E
				dalle: new UserDalle(),
				dalle_gen: new UserDalleGen(),
				// Codex
				codex: new UserCodex(),
				codex_gen: new UserCodexGen(),
			}
			this.humanUserId = defaultUserId;
			this.humanUserName = defaultUserName;
			this.saveData();
		},
		createMessageFromUserId(id: string, store: any): ChatMessage {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: User = this.getUserConfig(id);
			return createMessageFromUserConfig(cfg, store);
		},
		async generate(
			user: User,
			msgHist: ChatMessage[],
			ignoreCache?: boolean
		): Promise<PromptResponse> {
			ignoreCache = ignoreCache ?? false;
			console.warn("-".repeat(20));
			console.log('generate->actor:', user);
			console.log("generate->ignoreCache:", ignoreCache);

			msgHist = msgHist.filter((m: ChatMessage) => !m.hideInPrompt);
			const contextIds: string[] = msgHist.map((m: ChatMessage) => m.id);
			console.log("generate->contextIds:", contextIds);
			for (let i = 0; i < msgHist.length; i++) {
				console.log("----------------")
				console.log(`msgHist[${i}] -> (${msgHist[i].textSnippets.length} texts & ${msgHist[i].imageUrls.length} images)`,
					[...msgHist[i].textSnippets], {...msgHist[i]});
			}

			const prompt = new Prompt(this.currentThreadName, this.humanUserName, user, this.getUsersMap, msgHist);
			console.log("generate->prompt:", prompt)
			console.log("generate->prompt.hash:", prompt.hash)
			console.log("generate->prompt.text:")
			console.log(prompt.text)

			// if we already have a completion for this prompt, return it

			// TODO: Change hash prompt to be based on msgIds?

			let completion;
			let cached;
			try {
				if (!ignoreCache && this.getCachedResponseFromPrompt(prompt)) {
					completion = this.getCachedResponseFromPrompt(prompt)
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
					errorMsg: errorMsg,
					response: {
						contextIds: contextIds,
						responseData: undefined,
					},
					textSnippets: [],
					imageUrls: [],
					prompt: prompt,
				};
			}
			this.cachedResponses[prompt.hash] = {
				contextIds: contextIds,
				responseData: completion.data,
			};

			return {
				...this.getPromptResponse(prompt),
				cached: cached,
			};
		},
		pushMessage(message: ChatMessage, loading?: boolean): ChatMessage {
			// console.log("-------------------------------");
			let existingMsg: ChatMessage = this.getActiveThread.messageIdMap[message.id]
			if (existingMsg) {
				existingMsg = {
					...existingMsg,
					...message,
					loading: loading ?? false,
				}
				this.threadsMap[this.currentThreadId].messageIdMap[message.id] = existingMsg;
				this.saveData();
				return existingMsg;
			}
			// message.dateCreated = new Date();
			message.loading = loading ?? false;

			this.threadsMap[this.currentThreadId].messageIdMap[message.id] = message;
			this.saveData();
			return message;
		},
		deleteMessage(messageId: string, silent = false): void {
			if (!this.getActiveThread.messageIdMap[messageId]) {
				if (!silent) {
					smartNotify("An error occurred while deleting the message.");
				}
				console.error(`An error occurred while deleting the message: ${messageId}`);
				return;
			}
			const followUpIds = this.threadsMap[this.currentThreadId].messageIdMap[messageId].followupMsgIds;
			if (followUpIds) {
				for (let i = 0; i < followUpIds.length; i++) {
					this.deleteMessage(followUpIds[i], true);
				}
			}
			delete this.threadsMap[this.currentThreadId].messageIdMap[messageId];
			this.saveData();
			smartNotify("Successfully deleted message.");
		},
		async handleUserMessage(message: ChatMessage, comp: any, forceUserId?: string) {
			forceUserId = forceUserId || message.userId;
			const user: User = this.getUserConfig(forceUserId);
			const thread: ChatThread = comp.getActiveThread

			console.warn("*".repeat(40));

			console.log('handleUserMessage->cfg:', user);
			console.log('handleUserMessage->forceUserId:', forceUserId);
			console.log('handleUserMessage->message:', message);

			message.isCompRegen = message.response?.contextIds
				? message.response.contextIds.length > 0
				: false;
			console.log('handleUserMessage->message.isCompRegen:', message.isCompRegen);

			// if (msg.isCompRegen) {
			// 	console.warn("=> Regen");
			// 	msg.textSnippets = [];
			// 	msg.imageUrls = [];
			// }
			message.followupMsgIds.forEach((id: string) => {
				comp.deleteMessage(id, true);
			})
			message.followupMsgIds = [];
			comp.pushMessage(message, true);

			const msgHistIds = message.response?.contextIds
			let ignoreCache = user.shouldIgnoreCache === undefined ? false : user.shouldIgnoreCache;
			let msgHist;
			if (!msgHistIds) {
				// First-time generation
				msgHist = getMessageHistory(comp, {
					hiddenUserIds: user.id !== this.usersMap.coordinator.id ? [this.usersMap.coordinator.id] : [],
					maxMessages: 10,
					maxDate: message.dateCreated,
				});
			} else {
				// Re-generation from specified context
				msgHist = msgHistIds.map((id) => thread.messageIdMap[id]);
				// if there are any undefined messages, remove them
				msgHist = msgHist.filter((m) => m !== undefined);
				// TODO: This will end up with less messages than expected if there are any undefined messages
				ignoreCache = true;
			}

			const response: PromptResponse = await comp.generate(
				user,
				msgHist,
				ignoreCache
			);
			console.log('handleUserMessage->response:', response);
			message.response = response.response;
			message.cached = response.cached;

			if (response.errorMsg) {
				console.error('Error generating response:', response.errorMsg);
				message.textSnippets = ["[ERROR]" + "\n" + response.errorMsg]
				comp.pushMessage(message);
				return;
			}

			if (response?.textSnippets) message.textSnippets = response.textSnippets
			if (response?.imageUrls) message.imageUrls = response.imageUrls
			comp.pushMessage(message);

			const followupActors = message.textSnippets
				.flatMap((t: string) => t.toLowerCase().split("\n"))
				.filter((t: string) => t.includes("respond"))
				.flatMap((t: string) => t.split(":")[1].split(","))
				.map((a: string) => a.trim().toLowerCase())
				.filter((a: string) => a !== "none");

			let followupPrompts = message.textSnippets
				.filter((t: string) => t.includes("<prompt>"))
				.map((t: string) =>
					t.split("<prompt>")[1].trim().split("</prompt>")[0].trim()
				);

			const followups = []

			switch (user.id) {
				case this.usersMap.coordinator.id:
					if (followupActors.length === 0) {
						console.warn("=> No follow-ups");
						message.textSnippets.push("[INFO] It appears that all assistants chose to ignore your message, lol.");
						message.textSnippets.push("You could try sending a message that is a little more interesting!");
						break;
					}
					console.log('handleUserMessage->followupActors:', followupActors);
					for (const nextKey of followupActors) {
						const nextMsg: ChatMessage = this.createMessageFromUserId(
							nextKey,
							comp
						);
						message.followupMsgIds.push(nextMsg.id);
						nextMsg.dateCreated = message.dateCreated
						followups.push({
							msg: nextMsg,
							cfgUserId: undefined,
						});
					}
					break;
				default:
					message.textSnippets = message.textSnippets.map((t: string) => {
						if (t.includes("<prompt>")) {
							const parts = t.split("<prompt>");
							const end = parts[1].split("</prompt>");
							return parts[0] + end[1];
						}
						return t.trim();
					});
					message.textSnippets = message.textSnippets.filter((t: string) => t.length > 0);
					comp.pushMessage(message);

					followupPrompts = followupPrompts.filter((t: string) => t.split(" ").length > 3);
					if (followupPrompts.length > 0) {
						console.log("handleUserMessage->followupPrompts:", followupPrompts);
						// TODO: better way to handle this dynamically instead of hard-coding
						const followupPromptHelperId = user.followupPromptHelperId;
						if (!followupPromptHelperId) {
							console.error(`Error: ${user.id} generated ${followupPrompts.length} prompts, but no promptHelperId was specified.`);
							break
						}
						for (let i = 0; i < followupPrompts.length; i++) {
							const prompt = `<result>${followupPrompts[i]}</result>`
							/*
							// msg.textSnippets.push(prompt);
							const nextMsg: ChatMessage = createMessageFromUserId(
								msg.userId,
								comp,
							);
							msg.followupMsgIds.push(nextMsg.id);
							nextMsg.textSnippets.push(prompt);
							nextMsg.dateCreated = msg.dateCreated
							comp.pushMessage(nextMsg);
							followups.push({
								msg: nextMsg,
								cfgUserId: followupPromptHelperId,
							});
							*/

							message.textSnippets.push(prompt);
							const nextMsg: ChatMessage = this.createMessageFromUserId(
								followupPromptHelperId,
								comp,
							);
							message.followupMsgIds.push(nextMsg.id);
							// nextMsg.textSnippets.push(prompt);
							nextMsg.dateCreated = message.dateCreated
							// comp.pushMessage(nextMsg);
							followups.push({
								msg: nextMsg,
								cfgUserId: undefined,
							});
						}
					}
					break;
			}
			comp.pushMessage(message);
			for (const nextMsg of followups) {
				if (thread.prefs.orderedResponses) {
					await this.handleUserMessage(nextMsg.msg, comp, nextMsg.cfgUserId);
				} else {
					this.handleUserMessage(nextMsg.msg, comp, nextMsg.cfgUserId);
				}
			}
		},
		handleAssistantCfg(cfg: User, comp: any) {
			const msg = createMessageFromUserConfig(cfg, comp);
			return this.handleUserMessage(msg, comp);
		}
	},
});

