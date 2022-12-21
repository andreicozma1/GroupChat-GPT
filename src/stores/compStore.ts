import { defineStore } from "pinia"
import { LocalStorage } from "quasar"
import { OpenAIApi } from "openai"

export interface GenConfig {
	prompt: string,
	ignoreCache: boolean,
}

export interface MessageThread {
	messages: TextMessage[];
}

export interface TextMessage {
	text: string[];
	images?: string[];
	avatar: string;
	name: string;
	date: string | number | Date;
	objective?: string;
	dateCreated?: string | number;
	cached?: boolean;
}

export const useCompStore = defineStore("counter", {
	state  : () => ({
		config       : LocalStorage.getItem("config") || {
			apiKey: process.env.OPENAI_API_KEY
		},
		completions  : LocalStorage.getItem("completions") || {},
		threads      : {
			"main": {
				messages: []
			}, ...LocalStorage.getItem("threads") || {}
		} as Record<string, MessageThread>,
		currentThread: "main"
	}),
	getters: {
		getAllCompletions(state) {
			return state.completions
		},
		getThread(state) {
			return state.threads[state.currentThread]
		}
	},
	actions: {
		getByHash(hash: string) {
			return this.completions[hash]
		},
		getByPrompt(prompt: string) {
			// first hash the prompt
			const hash = hashPrompt(prompt)
			// then return the completion
			return this.completions[hash]
		},
		updateCache() {
			LocalStorage.set("completions", this.completions)
			LocalStorage.set("threads", this.threads)
		},
		async genTextCompletion(config: GenConfig) {
			const prompt = config.prompt
			const hash = hashPrompt(prompt)
			// if we already have a completion for this prompt, return it
			if (!config.ignoreCache && this.completions[hash]) {
				return {
					result: this.completions[hash],
					cached: true,
					hash  : hash
				}
			}
			console.log(this.config)
			const openai = new OpenAIApi(this.config)
			console.log(openai)
			// otherwise, generate a new completion
			try {
				const completion = await openai.createCompletion({
					model            : "text-davinci-002",
					prompt           : prompt,
					max_tokens       : 100,
					temperature      : 0.5,
					top_p            : 1,
					frequency_penalty: 0,
					presence_penalty : 0,
					stop             : [ "\n", "###" ]
				}, {
					headers: {
						"Authorization": `Bearer ${this.config.apiKey}`
					}
				})
				// then add it to the cache
				this.completions[hash] = completion.data
				this.updateCache()
				// and return it
				return {
					result: completion.data,
					cached: false,
					hash  : hash
				}
			} catch (error: any) {
				if (error.response) {
					console.warn(error.response.status)
					console.warn(error.response.data)
					return {
						result  : null,
						cached  : false,
						hash    : hash,
						errorMsg: `Error: ${error.response.status} ${error.response.data}`
					}
				}

				return {
					result  : null,
					cached  : false,
					hash    : hash,
					errorMsg: `Error: ${error}`
				}
			}
		},
		pushMessage(message: TextMessage) {
			this.threads[this.currentThread].messages.push(message)
			this.updateCache()
		},
		clearThread() {
			this.threads[this.currentThread].messages = []
			this.updateCache()
		}
	}
})

export const hashPrompt = (prompt: string) => {
	let hash = 0
	if (prompt.length === 0) return hash
	for (let i = 0; i < prompt.length; i++) {
		const char = prompt.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash
	}
	return hash
}