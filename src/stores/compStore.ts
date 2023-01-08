import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {getAppVersion} from "src/util/Utils";
import {Ref, ref} from "vue";
import {ChatUser} from "src/util/assistant/AssistantModels";
import {ChatMessage, ChatThread} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {makeApiRequest} from "src/util/openai/ApiReq";
import {createMessageFromUserConfig, getMessageHistory} from "src/util/chat/ChatUtils";
import {ConfigUser} from "src/util/users/ConfigUser";
import {ConfigDavinci} from "src/util/users/ConfigDavinci";
import {ConfigCoordinator} from "src/util/users/ConfigCoordinator";
import {ConfigDalle, ConfigDalleGen} from "src/util/users/ConfigDalle";
import {ConfigCodex, ConfigCodexGen} from "src/util/users/ConfigCodex";
import {Prompt} from "src/util/prompt/Prompt";

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

function createThread(humanUserId: string, joinedUserIds: string[] | undefined): ChatThread {
	joinedUserIds = joinedUserIds ?? ["davinci", "dalle", "codex"]
	if (joinedUserIds.length > 1) {
		joinedUserIds.push(ConfigCoordinator.id);
	}
	joinedUserIds.push(humanUserId);
	joinedUserIds = Array.from(new Set(joinedUserIds));
	return {
		messageIdMap: {},
		appVersion: getAppVersion(),
		joinedUserIds: joinedUserIds,
		prefs: {
			hiddenUserIds: [],
			hideIgnoredMessages: false,
			orderedResponses: true,
		},
	};
}

export const useCompStore = defineStore("counter", {
	state: () => ({
		usersMap: ref({
			user: ConfigUser,
			coordinator: ConfigCoordinator,
			davinci: ConfigDavinci,
			// DALL-E
			dalle: ConfigDalle,
			dalle_gen: ConfigDalleGen,
			// Codex
			codex: ConfigCodex,
			codex_gen: ConfigCodexGen,
			...(LocalStorage.getItem("users") || {}),
		}) as Ref<Record<string, ChatUser>>,
		threadsMap: ref({
			...(LocalStorage.getItem("threads") || {}),
		}) as Ref<Record<string, ChatThread>>,
		currentThread: "main",
		humanUserId: "user",
		cachedResponses: LocalStorage.getItem("cachedResponses") || {},
	}),
	getters: {
		getUsersMap(state): Record<string, ChatUser> {
			return state.usersMap;
		},
		getUserConfig(): (key: string) => ChatUser {
			return (key: string) => this.getUsersMap[key];
		},
		getHumanUserConfig(): ChatUser {
			return this.getUserConfig(this.humanUserId);
		},
		getThread(state): ChatThread {
			const thread = state.threadsMap[state.currentThread];
			if (!thread) {
				smartNotify("Thread not found: " + state.currentThread);
				this.threadsMap
			}
			return state.threadsMap[state.currentThread];
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
			LocalStorage.set("cachedResponses", this.cachedResponses);
			LocalStorage.set("threads", this.threadsMap);
			LocalStorage.set("users", this.usersMap);
		},
		clearAllData() {
			console.log("Clearing all data");
			// clear whole local storage and reload
			LocalStorage.clear();
			location.reload();
		},
		clearCompCache() {
			console.log("Clearing completions");
			// remove completions from local storage and reload
			LocalStorage.remove("cachedResponses");
			location.reload();
		},
		clearThreads() {
			console.log("Clearing threads");
			// remove threads from local storage and reload
			LocalStorage.remove("threads");
			location.reload();
		},
		clearUsers() {
			console.log("Clearing users");
			// remove users from local storage and reload
			LocalStorage.remove("users");
			location.reload();
		},
		clearThread() {
			console.log("Clearing thread");
			this.threadsMap[this.currentThread].messageIdMap = {}
			this.saveData();
		},
		getThreadVersion() {
			return this.threadsMap[this.currentThread].appVersion;
		},
		createThread(id: string, joinedUserIds?: string[]): ChatThread {
			const thread = createThread(this.getHumanUserConfig.id, joinedUserIds);
			thread.prefs.hiddenUserIds = thread.joinedUserIds.filter((id) => {
				const assistantConf: ChatUser = this.getUserConfig(id);
				if (!assistantConf) return true;
				return assistantConf.defaultHidden ?? false;
			}),
				this.threadsMap[id] = thread;
			this.currentThread = id;
			this.saveData();
			return thread;
		},
		createMessageFromUserId(id: string, store: any): ChatMessage {
			id = id.replace(/[.,/#!$%^&*;:{}=\-`~() ]/g, "").trim();
			const cfg: ChatUser = this.getUserConfig(id);
			return createMessageFromUserConfig(cfg, store);
		},
		async generate(
			actor: ChatUser,
			msgHist: ChatMessage[],
			ignoreCache?: boolean
		): Promise<PromptResponse> {
			ignoreCache = ignoreCache ?? false;
			console.warn("-".repeat(20));
			console.warn(`=> generate (${actor.id}):`, actor);

			const contextIds: string[] = msgHist.map((m: ChatMessage) => m.id);
			msgHist = msgHist.filter((m: ChatMessage) => !m.hideInPrompt);
			console.warn("=> msgHist:");
			for (let i = 0; i < msgHist.length; i++) {
				console.log("----------------")
				console.log(`msgHist[${i}] -> (${msgHist[i].textSnippets.length} texts & ${msgHist[i].imageUrls.length} images)`,
					[...msgHist[i].textSnippets], {...msgHist[i]});
			}

			const prompt = new Prompt(actor.promptConfig, this.getUsersMap, msgHist);
			console.warn("=> prompt:");
			console.log(prompt);
			console.warn(`=> ignoreCache: ${ignoreCache}`);

			// if we already have a completion for this prompt, return it

			// TODO: Change hash prompt to be based on msgIds?

			let completion;
			let cached;
			try {

				if (prompt === undefined) throw new Error("Prompt was undefined");
				if (!ignoreCache && this.getCachedResponseFromPrompt(prompt)) {
					completion = this.getCachedResponseFromPrompt(prompt)
					cached = true;
				} else {
					completion = await makeApiRequest(actor, prompt.text);
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
			this.saveData();

			return {
				...this.getPromptResponse(prompt),
				cached: cached,
			};
		},
		pushMessage(message: ChatMessage, loading?: boolean): ChatMessage {
			// console.log("-------------------------------");
			if (this.getThread.messageIdMap[message.id]) {
				const existingMsg = this.getThread.messageIdMap[message.id];
				if (existingMsg) {
					this.threadsMap[this.currentThread].messageIdMap[message.id] = {
						...existingMsg,
						...message,
						loading: loading ?? false,
					};
					this.saveData();
					return this.threadsMap[this.currentThread].messageIdMap[message.id];
				}
			}
			// message.dateCreated = new Date();
			this.getThread.messageIdMap[message.id] = message;
			this.saveData();
			return message;
		},
		deleteMessage(messageId: string, silent = false): void {
			if (!this.getThread.messageIdMap[messageId]) {
				if (!silent) {
					smartNotify("An error occurred while deleting the message.");
				}
				console.error(`An error occurred while deleting the message: ${messageId}`);
				return;
			}
			delete this.getThread.messageIdMap[messageId];
			this.saveData();
			smartNotify("Successfully deleted message.");
		},
		async handleUserMessage(message: ChatMessage, comp: any, cfgUserId?: string) {
			cfgUserId = cfgUserId || message.userId;
			const cfg = this.getUserConfig(cfgUserId);
			console.warn("*".repeat(40));

			console.warn(`=> handleUserMessage (${cfg.id})`);
			console.log("=> msg:", message);

			message.isCompRegen = message.response?.contextIds
				? message.response.contextIds.length > 0
				: false;
			console.log("=> msg.isCompRegen:", message.isCompRegen);

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
			let ignoreCache = cfg.shouldIgnoreCache === undefined ? false : cfg.shouldIgnoreCache;
			let msgHist;
			if (!msgHistIds) {
				// First-time generation
				msgHist = getMessageHistory(comp, {
					hiddenUserIds: cfg.id !== ConfigCoordinator.id ? [ConfigCoordinator.id] : [],
					maxLength: 10,
					maxDate: message.dateCreated,
				});
			} else {
				// Re-generation from specified context
				msgHist = msgHistIds.map((id) => comp.getThread.messageMap[id]);
				// if there are any undefined messages, remove them
				msgHist = msgHist.filter((m) => m !== undefined);
				// TODO: This will end up with less messages than expected if there are any undefined messages
				ignoreCache = true;
			}

			const res: PromptResponse = await comp.generate(
				cfg,
				msgHist,
				ignoreCache
			);
			console.log("=> res:", res);
			message.response = res.response;
			message.cached = res.cached;

			if (res.errorMsg) {
				console.error("=> res.errorMsg:", res.errorMsg);
				message.textSnippets = ["[ERROR]" + "\n" + res.errorMsg]
				comp.pushMessage(message);
				return;
			}

			if (res?.textSnippets) message.textSnippets = res.textSnippets
			if (res?.imageUrls) message.imageUrls = res.imageUrls
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

			const thread: ChatThread = comp.getThread
			const followups = []

			switch (cfg.id) {
				case ConfigCoordinator.id:
					if (followupActors.length === 0) {
						console.warn("=> No follow-ups");
						message.textSnippets.push("[INFO] It appears that all assistants chose to ignore your message, lol.");
						message.textSnippets.push("You could try sending a message that is a little more interesting!");
						break;
					}
					console.log("=> coordinator->next:", followupActors);
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
						console.log("promptText", followupPrompts);
						// TODO: better way to handle this dynamically instead of hard-coding
						const followupPromptHelperId = cfg.followupPromptHelperId;
						if (!followupPromptHelperId) {
							console.error("Error: ${cfg.id} generated ${followupPrompts.length} prompts, but no promptHelperId was specified.");
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
		handleAssistantCfg(cfg: ChatUser, comp: any) {
			const msg = createMessageFromUserConfig(cfg, comp);
			return this.handleUserMessage(msg, comp);
		}
	},
});

