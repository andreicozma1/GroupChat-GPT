import { OpenAIApi } from "openai"
import { defineStore } from "pinia"
import { LocalStorage } from "quasar"
import { ActorConfig, GenerationResult, MessageThread, TextMessage } from "src/util/Models"
import { v4 as uuidv4 } from "uuid"

const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY
}

const openai = new OpenAIApi(openAiConfig)
const options = {
	headers: {
		Authorization: `Bearer ${openAiConfig.apiKey}`
	}
}

interface MsgHistoryConfig {
	messages: TextMessage[]
	includeSelf?: boolean
	includeActors?: ActorConfig[]
	excludeActors?: ActorConfig[]
	maxLength?: number
}

const basePersonalityTraits = [ "enthusiastic", "helpful", "clever", "very friendly" ]
const baseAlways: string[] = [
	"respond for yourself" // "separate responses into proper paragraphs"
]
const baseNever: string[] = [ "make logical inconsistencies", "respond with links" ]

function getMsgHistory(config: MsgHistoryConfig): TextMessage[] {
	let hist = config.messages
	hist = hist.filter((m) => {
		// filter out coordinator messages
		if (m.name === actors.coordinator.name) return false
		// keep self by default if includeSelf is not set
		if (m.name === "Human") {
			// default to true
			if (config.includeSelf === undefined) return true
			return config.includeSelf
		}
		// handle actors to include and exclude
		if (config.includeActors) {
			return config.includeActors.some((actor) => actor.name === m.name)
		}
		if (config.excludeActors) {
			return !config.excludeActors.some((actor) => actor.name === m.name)
		}
		return true
	})
	hist = hist.filter((m) => m.text.length > 0)
	// slice the history
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength)
	return hist
}

const getAssistantsList = (useKey: boolean, exclude?: ActorConfig) => {
	return Object.values(actors).filter((a) => {
		if (a.key === actors.coordinator.key) return false
		if (exclude && a.key === exclude.key) return false
		if (a.available === undefined) return true
		return a.available
	}).map((actor) => {
		let res = `- ${useKey ? actor.key : actor.name}`
		if (actor.specialties) res += `: specializes in ${actor.specialties.join(", ")}`
		return res
	}).join("\n")
}

const getPromptCoordinator = (actor: ActorConfig, messages: TextMessage[]) => {
	let res = "### Response Coordinator:\n"
	res += "Classify which assistants would be best at responding to the next message.\n"
	res += "Only respond with the exact names of the assistants\n"
	res += "If the conversation is directed at multiple assistants, separate the names with a comma\n"
	res += "Also keep the logical consistency of the conversation in mind.\n"
	res += "\n\n"

	res += "### Available Assistants:\n"
	res += getAssistantsList(true)
	res += "\n\n"

	res += "### You:\n"
	res += "Hello, what's up?\n"
	res += "\n"

	res += `### ${actor.name}:\n`
	res += `Next: ${actors.davinci.key}\n`
	res += "\n"

	res += "### You:\n"
	res += "How are you all doing?\n"
	res += "\n"

	res += `### ${actor.name}:\n`
	res += `Next: ${Object.keys(actors).join(", ")}\n`
	res += "\n"

	messages = getMsgHistory({
		messages,
		includeSelf  : true,
		includeActors: undefined, 	// all ais
		maxLength    : 3
	})
	// now continue the prompt with the last 10 messages in the same format as the base prompt
	const prompt = messages.map((message) => {
		return `### ${message.name}:\n${message.text}\n`
	}).join("\n")
	res += prompt
	res += "\n"
	res += `### ${actor.name}:\n`
	res += "Next:"
	return res.trim()
}
const getBasePromptStart = (actor: ActorConfig) => {
	let res = `The following is a group-chat conversation with several AI assistants.\n`
	res += "\n"
	res += "### Other Members:\n"
	res += getAssistantsList(false, actor)
	res += "\n\n"
	res += `### Your name: ${actor.key}\n`
	if (actor.specialties) {
		res += `Specialties:\n- ${actor.specialties.join(", ")}.\n`
	}
	if (actor.personality) {
		res += `Personality:\n- ${actor.personality.join(", ")}.\n`
	}
	if (baseAlways.length > 0) {
		res += `ALWAYS:\n- ${baseAlways.slice(0, -1).join(", ")}, and ${baseAlways.slice(-1)}.\n`
	}
	if (baseNever.length > 0) {
		res += `NEVER:\n- ${baseNever.slice(0, -1).join(", ")}, or ${baseNever.slice(-1)}.\n`
	}
	res += "\n"
	res += "### Human:\n"
	res += "Hello, who are you?\n\n"
	res += `### ${actor.name}:\n`
	res += "I am an AI created by OpenAI. How can I help you today?\n\n"
	return res
}

function getBasePromptHistory(messages: TextMessage[]): string {
	messages = getMsgHistory({
		messages,
		includeSelf  : true,
		includeActors: undefined, // includeActors: undefined, 	// all ais
		maxLength    : 10
	})
	// now continue the prompt with the last 10 messages in the same format as the base prompt
	const prompt = messages.map((message) => {
		return `### ${message.name}:\n${message.text}\n\n`
	}).join("")
	return prompt
}

const getPromptDavinci = (actor: ActorConfig, messages: TextMessage[]) => {
	const start = getBasePromptStart(actor)
	const conv = getBasePromptHistory(messages)
	const end = `### ${actor.name}:\n`
	const prompt = start + conv + end
	return prompt.trim()
}

const getPromptDalle = (actor: ActorConfig, messages: TextMessage[]) => {
	const start = getBasePromptStart(actor)
	const conv = getBasePromptHistory(messages)
	const end = `### ${actor.name}:\n`
	const prompt = start + conv + end
	return prompt.trim()
}

const getPromptCodex = (actor: ActorConfig, messages: TextMessage[]) => {
	const start = getBasePromptStart(actor)
	const conv = getBasePromptHistory(messages)
	const end = `### ${actor.name}:\n`
	const prompt = start + conv + end
	return prompt.trim()
}

const getPromptDalleGen = (actor: ActorConfig, messages: TextMessage[]) => {
	const lastMessage = messages[messages.length - 1]
	return lastMessage.text[lastMessage.text.length - 1]
}

export const actors: Record<string, ActorConfig> = {
	davinci    : {
		key         : "davinci",
		name        : "Davinci",
		icon        : "chat",
		createPrompt: getPromptDavinci,
		createComp  : openai.createCompletion,
		config      : {
			model            : "text-davinci-003",
			max_tokens       : 250,
			temperature      : 0.75,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [ "creative", ...basePersonalityTraits ],
		specialties : [ "making general conversation" ]
	},
	dalle      : {
		key         : "dalle",
		name        : "DALL-E",
		icon        : "image",
		createPrompt: getPromptDalle,
		createComp  : openai.createCompletion,
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.75,
			max_tokens       : 100,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [ "artistic", "creative", "visionary", ...basePersonalityTraits ],
		specialties : [ "art", "painting", "drawing", "sketching" ]
	},
	codex      : {
		key         : "codex",
		name        : "Codex",
		icon        : "code",
		createPrompt: getPromptCodex,
		createComp  : openai.createCompletion,
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.75,
			max_tokens       : 100,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [ "analytical", "logical", "rational", ...basePersonalityTraits ],
		specialties : [ "programming", "coding", "software development" ]
	},
	coordinator: {
		key         : "coordinator",
		name        : "Coordinator",
		icon        : "question_answer",
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.25,
			max_tokens       : 100,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		createPrompt: getPromptCoordinator,
		createComp  : openai.createCompletion
	} // dalle_gen  : {
	// 	key         : "dalle_gen",
	// 	name        : "DALL-E",
	// 	icon        : "image",
	// 	config      : {
	// 		n     : 1,
	// 		size  : "256x256",
	// 		prompt: "A cute puppy"
	// 	},
	// 	createPrompt: getPromptDalleGen,
	// 	createComp  : openai.createImage
	// }
}

export const useCompStore = defineStore("counter", {
	state  : () => ({
		completions  : LocalStorage.getItem("completions") || {},
		threads      : {
			main: {
				messages: []
			}, ...(LocalStorage.getItem("threads") || {})
		} as Record<string, MessageThread>,
		currentThread: "main",
		userName     : "Human"
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
		updateCache() {
			LocalStorage.set("completions", this.completions)
			LocalStorage.set("threads", this.threads)
		},
		clearCache() {
			// clear whole local storage and reload
			LocalStorage.clear()
			location.reload()
		},
		clearThread() {
			this.threads[this.currentThread].messages = []
			this.updateCache()
		},
		getByHash(hash: number) {
			return this.completions[hash]
		},
		getCompletion(hash: number) {
			const completion = this.getByHash(hash)
			const choices = completion.choices
			const images = completion.data?.map((d: any) => d.url)
			// const text = choices ? choices[0].text.trim() : undefined
			const text = choices?.map((c: any) => c.text.trim())
			console.warn("=> text:", text)
			console.warn("=> images:", images)
			return {
				result: completion,
				text  : text,
				images: images,
				hash  : hash
			}
		},
		async genTextCompletion(actor: ActorConfig): Promise<GenerationResult> {
			const prompt = actor.createPrompt(actor, this.getThread.messages)
			console.warn(prompt)
			const hash = hashPrompt(prompt)
			// if we already have a completion for this prompt, return it
			if (!actor.ignoreCache && this.completions[hash]) {
				return {
					...this.getCompletion(hash),
					cached: true
				}
			}
			// otherwise, generate a new completion
			try {
				const completion = await actor.createComp({
					...actor.config,
					prompt: prompt
				}, options)

				if (!completion) throw new Error("No completion returned")
				// then add it to the cache
				this.completions[hash] = completion.data
				this.updateCache()

				return {
					...this.getCompletion(hash),
					cached: false
				}
			} catch (error: any) {
				let errorMsg = error
				if (error.response) errorMsg = `${error.response.status} ${error.response.data}`
				return {
					result  : null,
					cached  : false,
					hash    : hash,
					errorMsg: errorMsg
				}
			}
		},
		pushMessage(message: TextMessage) {
			if (message.id) {
				// look back through the messages to see if we already have this message
				// and update it if we do
				const existing = this.getThread.messages.find((m) => m.id === message.id)
				if (existing !== undefined) {
					for (const key in message) {
						existing[key] = message[key]
					}
					existing.date = new Date()
					console.log("Updated message", { ...existing })
					this.updateCache()
					return existing
				}
			}
			// otherwise, create uuid and push it
			message.id = uuidv4()
			this.getThread.messages.push(message)
			console.log("Pushed message", { ...message })
			this.updateCache()
			return message
		}
	}
})

export const hashPrompt = (prompt: string): number => {
	let hash = 0
	// lowercase, remove all punctuation
	prompt = prompt.toLowerCase()
	prompt = prompt.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
	if (prompt.length === 0) return hash
	for (let i = 0; i < prompt.length; i++) {
		const char = prompt.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash
	}
	return hash
}
