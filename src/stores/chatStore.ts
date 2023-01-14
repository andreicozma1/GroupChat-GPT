import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {getAppVersion, rHtmlTagWithContent} from "src/util/Utils";
import {ChatMessage, ChatThread, ChatThreadPrefs,} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {getMessageHistory} from "src/util/chat/ChatUtils";
import {Prompt} from "src/util/prompt/Prompt";
import {User, UserTypes} from "src/util/users/User";
import {UserHuman} from "src/util/users/UserHuman";
import {UserCodex, UserCoordinator, UserDalle, UserDavinci,} from "src/util/users/Assistant";
import {UserCodexGen, UserDalleGen} from "src/util/users/Helpers";

const localStorageKey = "data";
const defaultUserId = "humanUser";
const defaultUserName = "Human";
const defaultThreadId = "general";
const defaultThreadName = "General";
const defaultAssistants = ["davinci", "dalle", "codex"];

interface CachedResponse {
	contextIds: string[];
	data: any;
}

export interface PromptResponse {
	prompt: Prompt;
	response: CachedResponse;
	// TODO: Put these in a separate MessageContent interface and keep track of history
	textSnippets: string[];
	imageUrls: string[];

	errorMsg: string;
	cached: boolean;
}

const DefaultThread = {
	messageIdMap: {},
	appVersion: getAppVersion(),
	joinedUserIds: [],
	prefs: {
		hiddenUserIds: [],
		dontShowMessagesHiddenInPrompts: false,
		orderedResponses: true,
	},
};

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

		getCachedResponses(state) {
			return state.cachedResponses;
		},
		getCachedResponseFromPrompt(): (prompt: Prompt) => CachedResponse {
			return (prompt: Prompt) => this.getCachedResponses[prompt.hash];
		},
		getUserConfig() {
			return (key: string) => {
				if (key === this.humanUserId && !this.getUsersMap[key]) {
					this.getUsersMap[key] = new UserHuman(
						this.humanUserId,
						this.humanUserName
					);
				}
				return this.getUsersMap[key];
			}
		},
		getActiveThread(): ChatThread {
			console.warn("=".repeat(60))
			let needsSave = false;
			let thread = this.threadsMap[this.currentThreadId];
			if (!thread) {
				smartNotify("Creating new thread");
				thread = {...DefaultThread};
				needsSave = true;
			}

			// if the human isnt in the thread, add them
			if (!thread.joinedUserIds.includes(this.humanUserId)) {
				smartNotify("Joining thread: " + this.currentThreadId);
				thread.joinedUserIds.push(this.humanUserId);
				needsSave = true;
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
				needsSave = true;
			}
			for (const id of thread.joinedUserIds) {
				thread.joinedUserIds.push(...this.getUserConfig(id).requiresUserIds);
			}
			thread.joinedUserIds = Array.from(new Set(thread.joinedUserIds));
			console.log("getThread:", this.currentThreadId, {...thread});
			this.threadsMap[this.currentThreadId] = thread;
			return this.threadsMap[this.currentThreadId];
		},
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
			this.threadsMap[this.currentThreadId].messageIdMap = {};
			this.saveData();
		},
		clearCachedResponses() {
			smartNotify(`Clearing cached responses`);
			this.cachedResponses = {};
			this.saveData();
		},
		resetCurrentThreadPrefs() {
			smartNotify(`Resetting thread prefs: ${this.currentThreadId}`);
			this.threadsMap[this.currentThreadId].prefs = {
				...DefaultThread.prefs,
			} as ChatThreadPrefs;
			this.saveData();
		},
		resetCurrentThread() {
			smartNotify(`Resetting thread: ${this.currentThreadId}`);
			this.threadsMap[this.currentThreadId] = {
				...DefaultThread,
			} as ChatThread;
			this.saveData();
		},
		resetAllThreads() {
			smartNotify(`Resetting all threads`);
			this.threadsMap = {};
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
			};
			this.humanUserId = defaultUserId;
			this.humanUserName = defaultUserName;
			this.saveData();
		},
		createMessageFromUserId(id: string): ChatMessage {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: User = this.getUserConfig(id);
			return new ChatMessage(cfg, this);
		},

		getHumanUserConfig(): User {
			console.log(this.getUsersMap);
			console.log(this.getUserConfig(this.humanUserId));
			console.log(this.humanUserId);
			return this.getUserConfig(this.humanUserId);
		},

		parseApiResponse(response: CachedResponse) {
			// const cache = this.getCachedResponseFromPrompt(prompt);
			const responseData = response.data;
			const choices = responseData.choices;
			const text = choices?.flatMap((c: any) => {
				return c.text.trim();
			});
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
				textSnippets: text,
				imageUrls: images,
			};
		},
		async generate(
			user: User,
			msgHist: ChatMessage[],
			ignoreCache?: boolean
		): Promise<PromptResponse> {
			ignoreCache = ignoreCache ?? false;
			console.warn("-".repeat(20));
			console.log("generate->actor:", user);
			console.log("generate->ignoreCache:", ignoreCache);

			msgHist = msgHist.filter((m: ChatMessage) => !m.hideInPrompt);
			const contextIds: string[] = msgHist.map((m: ChatMessage) => m.id);
			console.log("generate->contextIds:", contextIds);
			for (let i = 0; i < msgHist.length; i++) {
				console.log("----------------");
				console.log(
					`msgHist[${i}] -> (${msgHist[i].textSnippets.length} texts & ${msgHist[i].imageUrls.length} images)`,
					[...msgHist[i].textSnippets],
					{...msgHist[i]}
				);
			}

			const prompt = new Prompt(
				this.currentThreadName,
				this.humanUserName,
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
					response: {
						contextIds: contextIds,
						data: undefined,
					},
					textSnippets: [],
					imageUrls: [],
					prompt: prompt,
				};
			}
			this.cachedResponses[prompt.hash] = {
				contextIds: contextIds,
				...completion,
			};

			return {
				errorMsg: "",
				prompt: prompt,
				response: this.cachedResponses[prompt.hash],
				cached: cached,
				...this.parseApiResponse(this.cachedResponses[prompt.hash]),
			};
		},
		deleteMessage(messageId: string, silent = false): void {
			if (!this.getActiveThread.messageIdMap[messageId]) {
				if (!silent) {
					smartNotify("An error occurred while deleting the message.");
				}
				console.error(
					`An error occurred while deleting the message: ${messageId}`
				);
				return;
			}
			const followUpIds =
				this.threadsMap[this.currentThreadId].messageIdMap[messageId]
					.followupMsgIds;
			if (followUpIds) {
				for (let i = 0; i < followUpIds.length; i++) {
					this.deleteMessage(followUpIds[i], true);
				}
			}
			delete this.threadsMap[this.currentThreadId].messageIdMap[messageId];
			this.saveData();
			smartNotify("Successfully deleted message.");
		},
		async handleUserMessage(message: ChatMessage) {
			const user: User = this.getUserConfig(message.userId);
			const thread: ChatThread = this.getActiveThread;

			console.warn("*".repeat(40));

			console.log("handleUserMessage->cfg:", user);
			console.log("handleUserMessage->message:", message);

			message.loading = true

			if (message.followupMsgIds.length > 0) {
				message.followupMsgIds.forEach((id: string) => {
					this.deleteMessage(id, true);
				});
				message.followupMsgIds = [];
			}

			if (user.type !== UserTypes.HUMAN) {
				const msgHistIds = message.response?.response?.contextIds;
				let ignoreCache = user.shouldIgnoreCache === undefined ? false : user.shouldIgnoreCache;
				let msgHist;
				if (!msgHistIds) {
					// First-time generation
					msgHist = getMessageHistory(thread, {
						hiddenUserIds:
							user.id !== this.usersMap.coordinator.id
								? [this.usersMap.coordinator.id]
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
				message.response = response;
				console.log("handleUserMessage->response:", message.response);

				if (response.errorMsg) {
					console.error("Error generating response:", response.errorMsg);
					message.textSnippets = ["[ERROR]" + "\n" + response.errorMsg];
					return;
				}

				if (response?.textSnippets) message.textSnippets = response.textSnippets;
				if (response?.imageUrls) message.imageUrls = response.imageUrls;
			}

			message.loading = false;

			// const followupActors = message.textSnippets
			// 	.flatMap((t: string) => t.toLowerCase().split("\n"))
			// 	.filter((t: string) => t.includes("respond"))
			// 	.flatMap((t: string) => t.split(":")[1].split(","))
			// 	.map((a: string) => a.trim().toLowerCase())
			// 	.filter((a: string) => a !== "none");
			// find if any instances of a member's name or id is in the message. otherwise default to the coordinator
			const followups = message.textSnippets.flatMap((t: string) => {
				const next = []
				const directMention = t.match(/@([a-zA-Z0-9_]+)/g);
				if (directMention) {
					// remove the @ and only keep valid usernames
					next.push(...directMention.map((m: string) => m.slice(1)).filter((m: string) => thread.joinedUserIds.includes(m)))
				}
				// also match html tags like <user_id>prompt</user_id>
				// where user_id can be only letters, numbers, and underscores
				// prompt may be anything
				const prompts = t.match(rHtmlTagWithContent);

				console.warn(t)
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

			if (user.id === this.getHumanUserConfig().id && followups.length === 0) {
				followups.push(this.usersMap.coordinator.id);
			}

			console.warn("handleUserMessage->followupActors:", followups);

			this.saveData()

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
		},
	},
});
