import { defineStore } from "pinia"
import { LocalStorage } from "quasar"
import { OpenAIApi } from "openai"

export interface GenConfig {
	prompt: string,
	ignoreCache: boolean,
}

export const useCompStore = defineStore("counter", {
	state  : () => ({
		completions: LocalStorage.getItem("completions") || {},
		config     : LocalStorage.getItem("config") || {
			apiKey: process.env.OPENAI_API_KEY
		},
		threads    : {
			main: {
				messages: []
			}
		}
	}),
	getters: {
		getAllCompletions(state) {
			return state.completions
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
			} catch (error) {
				if (error.response) {
					console.warn(error.response.status)
					console.warn(error.response.data)
				} else {
					console.warn(error.message)
				}
				return null
			}
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