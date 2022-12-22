import { defineStore } from "pinia"
import { LocalStorage } from "quasar"
import { OpenAIApi } from "openai"
import { CreateCompletionRequest, CreateImageRequest } from "openai/api"
import { v4 as uuidv4 } from "uuid"

interface PromptType {
	key: string;
	name?: string;
	createPrompt: any;
	config: CreateCompletionRequest | CreateImageRequest;
	createComp: any;
	icon: string;
}

export interface GenConfig {
	promptType: PromptType;
	maxHistoryLen?: number;
	ignoreCache: boolean;
}

export interface MessageThread {
	messages: TextMessage[];
}

export interface TextMessage {
	id?: string | number;
	text: string[];
	images: string[];
	avatar: string;
	name: string;
	date?: string | number | Date;
	objective?: string;
	dateCreated?: string | number;
	cached?: boolean;
	loading?: boolean;
}

const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY
}

const openai = new OpenAIApi(openAiConfig)
const options = {
	headers: {
		Authorization: `Bearer ${openAiConfig.apiKey}`
	}
}

const createChatStartPrompt = (messages: TextMessage[]) => {
	const personality = [ "helpful", "creative", "clever", "very friendly" ]

	let res = "The following is a conversation with an AI assistant named Davinci."
	// res += `The assistant is helpful, creative, clever, and very friendly.`
	res += `The assistant is ${personality.join(", ")}.`
	res += "When specifically asked to create an image, Davinci will let DALL-E know what the Human wants to see."
	res += "\n"
	res += "### Human:\nHello, who are you?\n"
	res += "\n"
	res += "### Davinci:\nI am an AI created by OpenAI. How can I help you today?\n"
	res += "\n"

	const maxLength = 10

	let prompt = messages.map((message) => {
		const txts = message.text.map((txt) => txt.trim()).join("\n")
		// let chunk = `### ${message.name.trim()}`
		let chunk = `### ${message.name.trim()}:`
		// const obj = message.objective?.trim()
		// if (obj) chunk += ` (${obj})`
		if (txts.trim().length === 0) return chunk
		chunk += `\n${txts}`
		return chunk
	})
	prompt = prompt.filter((chunk) => chunk !== undefined)
	prompt = prompt.slice(-maxLength)
	res += prompt.join("\n\n")
	return res.trim()
}

const createClassificationPrompt = (messages: TextMessage[]) => {
	// create some example prompts
	let res = "Based on the chat conversation please classify the task that needs to be done, and also generate a" + " suitable prompt for the task to be accomplished.\n"
	res += "Available tasks: generate_image, none.\n"
	res += "\n"

	res += "### Examples\n"
	res += "Chat: Sure thing! DALL-E is generating an image of a teddy bear with a pink and white striped bowtie.\n"
	res += "Task: generate_image\n"
	res += "Prompt: A picture of a teddy bear with a pink and white striped bowtie.\n"
	res += "\n"

	messages = messages.filter((m) => m.name === "Davinci").slice(-1)
	const prompt = messages.map((m) => m.text.join(". ")).join(". ")
	res += `\nChat: ${prompt}.`
	res += "\nTask:"
	return res.trim()
}

const createImagePrompt = (messages: TextMessage[]) => {
	const lastMessage = messages[messages.length - 1]
	return lastMessage.text[lastMessage.text.length - 1]
}

export const promptTypes: Record<string, PromptType> = {
	chat          : {
		key         : "chat",
		name        : "Davinci",
		config      : {
			model            : "text-davinci-003",
			max_tokens       : 250,
			temperature      : 0.75,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		createPrompt: createChatStartPrompt,
		createComp  : openai.createCompletion,
		icon        : "chat"
	},
	coordinator   : {
		key         : "coordinator",
		config      : {
			model            : "text-davinci-003",
			temperature      : 0.5,
			max_tokens       : 100,
			top_p            : 1,
			frequency_penalty: 0,
			presence_penalty : 0,
			stop             : [ "###" ]
		},
		createPrompt: createClassificationPrompt,
		createComp  : openai.createCompletion,
		icon        : "question_answer"
	},
	generate_image: {
		key         : "generate_image",
		name        : "DALL-E",
		config      : {
			n     : 1,
			size  : "256x256",
			prompt: "A cute puppy"
		},
		createPrompt: createImagePrompt,
		createComp  : openai.createImage,
		icon        : "image"
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
		userName     : "You"
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
		async genTextCompletion(config: GenConfig): Promise<GenerationResult> {
			const prompt = config.promptType.createPrompt(this.getThread.messages)
			console.warn(prompt)
			const hash = hashPrompt(prompt)
			// if we already have a completion for this prompt, return it
			if (!config.ignoreCache && this.completions[hash]) {
				return {
					...this.getCompletion(hash),
					cached: true
				}
			}
			// otherwise, generate a new completion
			try {
				const completion = await config.promptType.createComp({
					...config.promptType.config,
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

export interface GenerationResult {
	result: any;
	text?: string[];
	images?: string[];
	hash: number;
	cached: boolean;
	errorMsg?: string;
}

export const hashPrompt = (prompt: string): number => {
	let hash = 0
	if (prompt.length === 0) return hash
	for (let i = 0; i < prompt.length; i++) {
		const char = prompt.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash
	}
	return hash
}
