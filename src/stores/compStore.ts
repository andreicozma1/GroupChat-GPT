import { OpenAIApi } from "openai"
import { defineStore } from "pinia"
import { LocalStorage } from "quasar"
import { ActorConfig, GenerationResult, MessageThread, TextMessage } from "src/util/Models"
import { v4 as uuidv4 } from "uuid"
import { Ref, ref } from "vue"

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
	messages: TextMessage[];
	includeSelf?: boolean;
	includeActors?: ActorConfig[];
	excludeActors?: ActorConfig[];
	maxLength?: number;
}

const basePersonalityTraits = [ "enthusiastic", "clever", "very friendly" ]

const baseAlways: string[] = [
	"follow the user's directions",
	// "respond for yourself",
	"add to information in the conversation if needed",
	"use bulleted lists when listing multiple things",
	"stay true your own personality traits, specialties, interests, and behaviors"
]

const baseNever: string[] = [
	"interrupt conversation with other AIs",
	"repeat yourself too much nor repeat what other AIs have just said",
	"ask more than one question at a time",
	"make logical inconsistencies",
	"explain your behaviors to the human unless asked"
	// "ask the user to do something that is part of your job"
]

const generationAbility: string[] = [
	"When the user wants to generate something, acquire information about the user's interests and preferences.",
	"When you say you'll generate the result, you will always create a detailed prompt which you will wrap the final prompt with <prompt> and </prompt> tags.",
	"If there is a list of prompts, wrap each prompt with <prompt> and </prompt> tags.",
	// "Only show the final prompts to the user if the user has explicitly asked.",
	"When you say you will complete a request, it will respond with the prompt and only with the prompt."
]

function getMsgHistory(config: MsgHistoryConfig): TextMessage[] {
	let hist = config.messages
	hist = hist.filter((m) => {
		if (m.name === "Human") {
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
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength)
	return hist
}

const getAssistantsList = () => {
	return Object.values(actors).filter((a) => {
		if (a.available === undefined) return true
		return a.available
	})
}

const getAssistantsDescList = (useKey: boolean, currentAI?: ActorConfig) => {
	return getAssistantsList()
		.map((ai) => {
			const id = useKey ? ai.key : ai.name
			let res = `# ${id}`
			if (currentAI && currentAI.key === ai.key) res += " (You)"
			res += ":\n"
			if (ai.personality) res += `- Personality Traits: ${ai.personality.join(", ")}.\n`
			if (ai.strengths) res += `- Strengths: ${ai.strengths.join(", ")}.\n`
			if (ai.weaknesses) res += `- Weaknesses: ${ai.weaknesses.join(", ")}.\n`
			return res
		})
		.join("\n") + "\n"
}

const getBasePromptStart = (actor: ActorConfig) => {
	let res = `The following is a group-chat conversation between a human and several AI assistants.\n`
	res += "\n"

	res += "### ASSISTANT RULES ###\n"
	if (baseAlways.length > 0) {
		res += `# Assistants always:\n`
		res += baseAlways.map((b) => `- Always ${b}`).join("\n")
		res += "\n\n"
	}
	if (baseNever.length > 0) {
		res += `# Assistants never:\n`
		res += baseNever.map((b) => `- Never ${b}`).join("\n")
		res += "\n\n"
	}

	res += "### ASSISTANTS ###\n"
	res += getAssistantsDescList(false, actor)

	if (actor.abilities) {
		res += `### ${actor.name}'s Abilities:\n`
		res += actor.abilities.map((b) => `- ${b}`).join("\n")
		res += "\n\n"
	}

	res += "### CONVERSATION ###\n"
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
	return messages
		.map((message) => {
			return `### ${message.name}:\n${message.text.join("\n")}\n\n`
		})
		.join("")
}

const getPromptCoordinator = (actor: ActorConfig, messages: TextMessage[]) => {
	let res = "### COORDINATOR ###\n"
	res += "Classify which assistants would be best at responding to the next message."
	res += "Only respond with the exact names of the assistants\n"
	res += "If the user's request is specifically directed at multiple assistants, separate the names with a comma\n"
	res += "Also keep the logical consistency of the conversation in mind.\n"
	res += "\n"

	res += "### ASSISTANTS ###\n"
	res += getAssistantsDescList(true)

	res += "### EXAMPLES ###\n"
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
	res += `Next: ${getAssistantsList()
		.map((a) => a.key)
		.join(", ")}\n`
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

	res += "### CONVERSATION ###\n"

	messages = getMsgHistory({
		messages,
		includeSelf  : true,
		includeActors: undefined,
		maxLength    : 5
	})

	const prompt = messages
		.map((message) => {
			return `### ${message.name}:\n${message.text}\n`
		})
		.join("\n")
	res += prompt
	res += "\n"
	res += `### ${actor.name}:\n`
	res += "Next:"
	return res.trim()
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
			temperature      : 0.6,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [ "helpful", "creative", ...basePersonalityTraits ],
		strengths   : [
			"making general conversation", "answering questions", "providing general information"
		]
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
			temperature      : 0.85,
			max_tokens       : 250,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [
			"artistic", "creative", "visionary", ...basePersonalityTraits
		],
		strengths   : [ "art", "painting", "drawing", "sketching", "image generation" ],
		weaknesses  : [ "anything not related to my specialties" ],
		abilities   : [ ...generationAbility ]
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
			temperature      : 0.75,
			max_tokens       : 250,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		personality : [
			"analytical", "logical", "rational", ...basePersonalityTraits
		],
		strengths   : [ "programming", "software development", "code generation" ],
		weaknesses  : [ "anything not related to my specialties" ],
		abilities   : [ ...generationAbility ]
	},
	coordinator: {
		key         : "coordinator",
		name        : "Coordinator",
		icon        : "question_answer",
		createPrompt: getPromptCoordinator,
		createComp  : openai.createCompletion,
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.7,
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
		threads      : ref({
			main: {
				messages: []
			}, ...(LocalStorage.getItem("threads") || {})
		}) as Ref<Record<string, MessageThread>>,
		currentThread: "main",
		userName     : "Human"
	}),
	getters: {
		getAllCompletions(state) {
			return state.completions
		},
		getThread(state): MessageThread {
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
			const text = choices
				?.flatMap((c: any) => c.text
					.replace("<prompt>\n", "<prompt>")
					.replace("\n</prompt>", "</prompt>")
					.split("\n"))
				.map((t: string) => t.trim())
				.filter((t: string) => t.length > 0)

			console.warn("=> text:", text)
			console.warn("=> images:", images)
			return {
				result: completion,
				text  : text,
				images: images,
				hash  : hash
			}
		},
		async genCompletion(actor: ActorConfig): Promise<GenerationResult> {
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
				let errorMsg = JSON.stringify(error)
				if (error.response) errorMsg = `${error.response.status} ${JSON.stringify(error.response.data)}`
				return {
					result  : null,
					cached  : false,
					hash    : hash,
					errorMsg: errorMsg
				}
			}
		},
		pushMessage(message: TextMessage): TextMessage {
			if (message.id) {
				// look back through the messages to see if we already have this message
				// and update it if we do
				const existingIdx = this.getThread.messages.findIndex((m) => m.id === message.id)
				if (existingIdx !== -1) {
					this.threads[this.currentThread].messages[existingIdx] = {
						...this.threads[this.currentThread].messages[existingIdx], ...message
					}
					console.log("Updated message: ", { ...message })
					this.updateCache()
					return this.threads[this.currentThread].messages[existingIdx]
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
