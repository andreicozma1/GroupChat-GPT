import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import { actors } from "src/util/assistants/Configs"
import { ActorConfig, GenerationResult, MessageThread, TextMessage } from "src/util/Models";
import { openai, options } from "src/util/OpenAIUtil";
import { v4 as uuidv4 } from "uuid";
import { Ref, ref } from "vue";

export const humanName = "Human";

export const getAvailable = (): ActorConfig[] => {
	return Object.values(actors).filter((a) => {
		if (a.available === undefined) return true;
		return a.available;
	});
};

export const allExcept = (actor: ActorConfig): ActorConfig[] => {
	return getAvailable().filter((a) => a.key !== actor.key);
};

export const toKeys = (actors: ActorConfig[]): string[] => {
	return actors.map((a) => a.key);
};

const toNames = (actors: ActorConfig[]): string[] => {
	return actors.map((a) => a.name);
};

export const useCompStore = defineStore("counter", {
	state: () => ({
		completions: LocalStorage.getItem("completions") || {},
		threads: ref({
			main: {
				messages: [],
			},
			...(LocalStorage.getItem("threads") || {}),
		}) as Ref<Record<string, MessageThread>>,
		currentThread: "main",
		userName: humanName,
	}),
	getters: {
		getAllCompletions(state) {
			return state.completions;
		},
		getThread(state): MessageThread {
			return state.threads[state.currentThread];
		},
	},
	actions: {
		updateCache() {
			LocalStorage.set("completions", this.completions);
			LocalStorage.set("threads", this.threads);
		},
		clearCache() {
			// clear whole local storage and reload
			LocalStorage.clear();
			location.reload();
		},
		clearThread() {
			this.threads[this.currentThread].messages = [];
			this.updateCache();
		},
		getCachedResponse(hash: number) {
			return this.completions[hash];
		},
		getCompletion(hash: number): GenerationResult {
			const cachedResponse = this.getCachedResponse(hash);
			if (cachedResponse === null || cachedResponse === undefined) {
				return {
					errorMsg: "Cached response was null/undefined",
					result: null,
					cached: undefined,
					hash: hash,
				};
			}

			const choices = cachedResponse.choices;
			const text = choices
				?.flatMap((c: any) =>
					c.text.replace("<prompt>\n", "<prompt>").replace("\n</prompt>", "</prompt>").split("\n")
				)
				.map((t: string) => t.trim())
				.filter((t: string) => t.length > 0);
			console.warn("=> text:", text);

			const images = cachedResponse.data?.map((d: any) => d.url);
			console.warn("=> images:", images);
			return {
				cached: undefined,
				hash: hash,
				text: text,
				images: images,
				result: cachedResponse,
			};
		},
		async genCompletion(actor: ActorConfig): Promise<GenerationResult> {
			const prompt = actor.createPrompt(actor, this.getThread.messages);
			const hash = hashPrompt(prompt);
			console.warn(prompt);
			// if we already have a completion for this prompt, return it
			if (!actor.ignoreCache && this.completions[hash]) {
				return {
					...this.getCompletion(hash),
					cached: true,
				};
			}

			let completion;
			try {
				// otherwise, generate a new completion
				if (actor.createComp) {
					completion = await actor.createComp(
						{
							...actor.config,
							prompt: prompt,
						},
						options
					);
				} else {
					completion = await openai.createCompletion(
						{
							...actor.config,
							prompt: prompt,
						},
						options
					);
				}

				if (completion === null || completion === undefined) throw new Error("No response");
			} catch (error: any) {
				console.error(error);
				if (error.stack) console.error(error.stack);
				let errorMsg = "";
				if (error.message) errorMsg += error.message;
				if (error.response) {
					errorMsg += "\n" + "Status: " + error.response.status;
					errorMsg += "\n" + "Data: " + JSON.stringify(error.response.data, null, 4);
				}
				return {
					errorMsg: errorMsg,
					result: null,
					cached: false,
					hash: hash,
				};
			}
			this.completions[hash] = completion.data;
			this.updateCache();

			return {
				...this.getCompletion(hash),
				cached: false,
			};
		},
		pushMessage(message: TextMessage): TextMessage {
			if (message.id) {
				// look back through the messages to see if we already have this message
				// and update it if we do
				const existingIdx = this.getThread.messages.findIndex((m) => m.id === message.id);
				if (existingIdx !== -1) {
					this.threads[this.currentThread].messages[existingIdx] = {
						...this.threads[this.currentThread].messages[existingIdx],
						...message,
					};
					console.log("Updated message: ", { ...message });
					this.updateCache();
					return this.threads[this.currentThread].messages[existingIdx];
				}
			}
			// otherwise, create uuid and push it
			message.id = uuidv4();
			this.getThread.messages.push(message);
			console.log("Pushed message", { ...message });
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
