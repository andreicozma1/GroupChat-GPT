import {defineStore} from "pinia";
import {LocalStorage} from "quasar";
import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {getMessageHistory} from "src/util/chat/ChatUtils";
import {makeApiRequest} from "src/util/OpenAi";
import {getAppVersion} from "src/util/Utils";
import {Ref, ref} from "vue";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage, ChatThread} from "src/util/chat/ChatModels";

export interface GenerationResult {
	result?: {
		contextIds: string[];
		responseData: any;
	};
	// TODO: Put these in a separate MessageContent interface and keep track of history
	textSnippets: string[];
	imageUrls: string[];
	hash?: number;
	cached?: boolean;
	errorMsg?: string;
}

export const createThread = (): ChatThread => {
	const res: ChatThread = {
		orderedKeysList: [],
		messageMap: {},
		appVersion: getAppVersion(),
		joinedUserIds: ["coordinator", "davinci", "dalle", "codex"],
		prefs: {
			hiddenUsers: [],
			showDeletedMessages: false,
			orderedResponses: true,
		}
	}
	return res
}

export const useCompStore = defineStore("counter", {
	state: () => ({
		completions: LocalStorage.getItem("completions") || {},
		threads: ref({
			main: createThread(),
			...(LocalStorage.getItem("threads") || {}),
		}) as Ref<Record<string, ChatThread>>,
		currentThread: "main",
	}),
	getters: {
		getAllCompletions(state) {
			return state.completions;
		},
		getThread(state): ChatThread {
			return state.threads[state.currentThread];
		},
	},
	actions: {
		updateCache() {
			LocalStorage.set("completions", this.completions);
			LocalStorage.set("threads", this.threads);
		},
		clearCache() {
			console.log("Clearing cache");
			// clear whole local storage and reload
			LocalStorage.clear();
			location.reload();
		},
		clearThread() {
			console.log("Clearing thread");
			this.threads[this.currentThread].orderedKeysList = [];
			this.updateCache();
		},
		getTreadVersion() {
			return this.threads[this.currentThread].appVersion;
		},
		getCachedResponse(hash: number) {
			return this.completions[hash];
		},
		getCompletion(hash: number): GenerationResult {
			const cache = this.getCachedResponse(hash);
			if (cache === null || cache === undefined) {
				return {
					errorMsg: "Cached response was null/undefined",
					result: undefined,
					textSnippets: [],
					imageUrls: [],
					cached: undefined,
					hash: hash,
				};
			}
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
				hash: hash,
				textSnippets: text,
				imageUrls: images,
				result: cache,
			};
		},
		async generate(
			actor: Assistant,
			updateFromMsgIds?: string[]
		): Promise<GenerationResult> {
			console.warn("=======================================");
			console.warn("=> generate:", actor);
			let ignoreCache = actor.shouldIgnoreCache;
			let msgHist;
			if (!updateFromMsgIds) {
				msgHist = getMessageHistory({
					thread: this.getThread,
					includeSelf: true,
					includeActors: undefined,
					excludeActors: [AssistantConfigs.coordinator],
					maxLength: 10,
				});
			} else {
				msgHist = updateFromMsgIds.map(
					(id) => this.getThread.messageMap[id]
				);
				ignoreCache = true;
			}
			const prompt = actor.promptStyle(actor, msgHist);
			const contextIds: string[] = msgHist.map((m: ChatMessage) => m.id)
			// TODO: Change hash prompt to be based on msgIds?
			const hash = hashPrompt(prompt);
			console.warn("=> prompt:");
			console.log(prompt);
			// if we already have a completion for this prompt, return it
			if (!ignoreCache && this.completions[hash]) {
				return {
					...this.getCompletion(hash),
					cached: true,
				};
			}
			let completion;
			try {
				completion = await makeApiRequest(actor, prompt);
				if (completion === null || completion === undefined)
					throw new Error("No response");
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
					result: {
						contextIds: contextIds,
						responseData: undefined,
					},
					textSnippets: [],
					imageUrls: [],
					cached: false,
					hash: hash,
				};
			}
			this.completions[hash] = {
				contextIds: contextIds,
				responseData: completion.data,
			};
			this.updateCache();

			return {
				...this.getCompletion(hash),
				cached: false,
			};
		},
		pushMessage(message: ChatMessage): ChatMessage {
			// console.log("-------------------------------");
			if (this.getThread.messageMap[message.id]) {
				const existingMsg = this.getThread.messageMap[message.id];
				if (existingMsg) {
					this.threads[this.currentThread].messageMap[message.id] = {
						...existingMsg,
						...message,
						loading: false,
					};
					this.updateCache();
					return this.threads[this.currentThread].messageMap[message.id];
				}
			}
			// message.dateCreated = new Date();
			this.getThread.messageMap[message.id] = message;
			this.getThread.orderedKeysList.push(message.id);
			this.updateCache();
			return message;
		},
	},
});

export const hashPrompt = (prompt: string): number => {
	let hash = 0;
	// lowercase, remove all punctuation
	prompt = prompt.toLowerCase();
	prompt = prompt.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
	if (prompt.length === 0) return hash;
	for (let i = 0; i < prompt.length; i++) {
		const char = prompt.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash;
};
