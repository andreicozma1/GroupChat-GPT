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

const basePersonalityTraits = [ "enthusiastic", "clever", "very friendly" ]

const baseAlways: string[] = [
	"follow the user's directions",
	"respond for yourself",
	"add to information in the conversation if needed",
	"make appropriate use of bulleted lists and new paragraphs using newline characters",
	"stay true your own personality traits, specialties, interests, and behaviors"
]

const baseNever: string[] = [
	"interrupt conversation with other AIs",
	"repeat yourself too much",
	"repeat what other AIs have just said",
	"explain your behaviors to the human unless asked",
	"make logical inconsistencies"
	// "ask the user to do something that is part of your job"
]

const generationBehaviors: string[] = [
	"When the user wants to generate something, acquire information about the user's interests and preferences.",
	"When you say you'll generate the result, you will always create a detailed prompt which you will wrap the final prompt with <prompt> and </prompt> tags.",
	"Only show the final prompt to the user if the user has explicitly asked for it."
]

function getMsgHistory(config: MsgHistoryConfig): TextMessage[] {
	let hist = config.messages
	hist = hist.filter((m) => {
		// filter out coordinator messages
		// if (m.name === actors.coordinator.name) return false
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

const getAssistantsList = () => {
	return Object.values(actors).filter((a) => {
		if (a.available === undefined) return true
		return a.available
	})
}

const getAssistantsDescList = (useKey: boolean, exclude?: ActorConfig) => {
	return getAssistantsList().map((actor) => {
		let res = `- ${useKey ? actor.key : actor.name}`
		if (actor.specialties) res += `: specializes in ${actor.specialties.join(", ")}`
		return res
	}).join("\n")
}

const getPromptCoordinator = (actor: ActorConfig, messages: TextMessage[]) => {
	let res = "### Response Coordinator:\n"
	res += "Classify which assistants would be best at responding to the next message."
	res += "Only respond with the exact names of the assistants\n"
	res += "If the conversation is specifically directed at multiple assistants, separate the names with a comma\n"
	res += "Also keep the logical consistency of the conversation in mind.\n"
	res += "\n"

	res += "### Available Assistants:\n"
	res += getAssistantsDescList(true)
	res += "\n\n"

	res += "### Human:\n"
	res += "Hello, what's up?\n"
	res += "\n"

	res += `### ${actor.name}:\n`
	res += `Next: ${actors.davinci.key}\n`
	res += "\n"

	res += "### Human:\n"
	res += "How are you all doing?\n"
	res += "\n"

	res += `### ${actor.name}:\n`
	res += `Next: ${getAssistantsList().map((a) => a.key).join(", ")}\n`
	res += "\n"

	res += "### Human:\n"
	res += "Hey Codex!\n"
	res += "\n"

	res += `### ${actor.name}:\n`
	res += `Next: ${actors.codex.key}\n`
	res += "\n"

	res += "### Human:\n"
	res += "I need to create a painting.\n"
	res += "\n"

	res += `### ${actor.name}:\n`
	res += `Next: ${actors.dalle.key}\n`
	res += "\n"

	messages = getMsgHistory({
		messages,
		includeSelf  : true, // includeActors: [ actors.coordinator ],
		includeActors: undefined,
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
	res += `### Your are ${actor.name}\n`

	res += "### Other Members:\n"
	res += getAssistantsDescList(false, actor)
	res += "\n\n"

	res += `### About ${actor.name}:\n`
	if (actor.specialties) {
		res += `# Your Specialties:\n`
		// - ${actor.specialties.join(", ")}.\n`
		res += actor.specialties.map((s) => `- ${s}`).join("\n")
		res += "\n\n"
	}
	if (actor.personality) {
		res += `# Your Personality:\n`
		// - ${actor.personality.join(", ")}.\n`
		res += actor.personality.map((s) => `- ${s}`).join("\n")
		res += "\n\n"
	}
	if (actor.behaviors) {
		res += `# Your Behaviors:\n`
		res += actor.behaviors.map((b) => `- ${b}`).join("\n")
		res += "\n\n"
	}
	if (baseAlways.length > 0) {
		res += `# You will always:\n`
		res += baseAlways.map((b) => `- ${b}`).join("\n")
		res += "\n\n"
		// res += `- ${baseAlways.slice(0, -1).join(", ")}, and ${baseAlways.slice(-1)}.\n`
	}
	if (baseNever.length > 0) {
		res += `# You will never:\n`
		res += baseNever.map((b) => `- ${b}`).join("\n")
		res += "\n\n"
		// res += `- ${baseNever.slice(0, -1).join(", ")}, and ${baseNever.slice(-1)}.\n`
	}
	res += "\n"
	// res += "### Human:\n"
	// res += "Hello, who are you?\n\n"
	// res += `### ${actor.name}:\n`
	// res += "I am an AI created by OpenAI. How can I help you today?\n\n"
	return res
}

function getBasePromptHistory(messages: TextMessage[]): string {
	messages = getMsgHistory({
		messages,
		includeSelf  : true,
		includeActors: undefined, // all ais
		excludeActors: [ actors.coordinator ],
		maxLength    : 10
	})
	// now continue the prompt with the last 10 messages in the same format as the base prompt
	const prompt = messages.map((message) => {
		return `### ${message.name}:\n${message.text.join("\n")}\n\n`
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
		personality : [ "helpful", "creative", ...basePersonalityTraits ],
		specialties : [ "making general conversation" ]
	},
	dalle      : {
		key         : "dalle",
		name        : "DALL-E",
		icon        : "image",
		createPrompt: getPromptDalle,
		createComp  : openai.createCompletion,
		createGen   : "dalle_gen",
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.5,
			max_tokens       : 250,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [ "artistic", "creative", "visionary", ...basePersonalityTraits ],
		specialties : [ "art", "painting", "drawing", "sketching", "image generation" ],
		behaviors   : [
			...generationBehaviors
		]
	},
	codex      : {
		key         : "codex",
		name        : "Codex",
		icon        : "code",
		createPrompt: getPromptCodex,
		createComp  : openai.createCompletion,
		createGen   : "codex_gen",
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.5,
			max_tokens       : 250,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [ "analytical", "logical", "rational", ...basePersonalityTraits ],
		specialties : [ "programming", "software development", "code generation" ],
		behaviors   : [
			...generationBehaviors
		]
	},
	coordinator: {
		key         : "coordinator",
		name        : "Coordinator",
		icon        : "question_answer",
		createPrompt: getPromptCoordinator,
		createComp  : openai.createCompletion,
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.3,
			max_tokens       : 25,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},

		available: false
	},
	dalle_gen  : {
		key         : "dalle_gen",
		name        : "DALL-E",
		icon        : "image",
		createPrompt: getPromptDalleGen,
		createComp  : openai.createImage,
		config      : {
			n     : 1,
			size  : "256x256",
			prompt: "A cute puppy"
		},
		available   : false
	}
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
			console.log(choices)
			const text = choices?.flatMap((c: any) => c.text.split("\n")).map((t: string) => t.trim()).filter(
				(t: string) => t.length > 0)

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
			const prpt = actor.createPrompt(actor, this.getThread.messages)
			console.warn(prpt)
			const hash = hashPrompt(prpt)
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
					prompt: prpt
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
