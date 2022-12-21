import { defineStore } from "pinia"
import { LocalStorage } from "quasar"
import { OpenAIApi } from "openai"
import { getSeededAvatarURL } from "src/util/Util"

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
					model : "text-davinci-002",
					prompt: prompt
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
		pushAIMessage(res) {
			const result = res?.result
			if (!result) {
				console.error("No result to push")
				return
			}
			const model = result?.model
			const objective = result?.object
			const name = `AI ${model} (${objective})`
			const currDate = new Date()
			const msg: TextMessage = {
				text       : [ result?.choices[0]?.text ],
				images     : [],
				avatar     : getSeededAvatarURL(name),
				name       : name,
				date       : currDate,
				objective  : result?.object,
				dateCreated: result?.created * 1000,
				cached     : res?.cached
			}
			this.getThread.messages.push(msg)
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