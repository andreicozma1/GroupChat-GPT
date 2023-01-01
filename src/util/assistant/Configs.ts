import { createAssistantPrompt, createPromptDalleGen } from "src/util/assistant/Prompts";
import { AssistantConfig } from "src/util/assistant/Util";

export const ApiReqConfigs: { [key: string]: { [key: string]: any } } = {
	defaults: {
		chatting: {
			max_tokens: 250,
			temperature: 0.75,
			frequency_penalty: 0.0,
			presence_penalty: 0.6,
		},
		coordinator: {
			temperature: 0.6,
			max_tokens: 25,
		},
	},
	custom: {},
};

// TODO: Use this generic config in the prompt creation functions
export const AssistantConfigShared: AssistantConfig = {
	key: "generic",
	name: "Generic AI",
	icon: "chat",
	promptStyle: createAssistantPrompt,
	apiConfig: {
		apiReqType: "createCompletion",
		apiReqOpts: "chatting",
	},
	traits: {
		personality: ["friendly", "polite", "helpful"],
		strengths: ["making conversation", "answering questions"],
	},
	rules: {
		always: ["follow the user's instructions, requests, and answer their questions if appropriate to do so."],
		never: [
			"respond to other assistant's questions, but may acknowledge their presence and offer insight into the conversation",
		],
	},
};

export const AssistantConfigs: Record<string, AssistantConfig> = {
	davinci: {
		key: "davinci",
		name: "Davinci",
		icon: "chat",
		promptStyle: createAssistantPrompt,
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "chatting",
		},
		traits: {
			personality: ["helpful"],
			strengths: ["providing general information"],
		},
	},
	dalle: {
		key: "dalle",
		name: "DALL-E",
		icon: "image",
		promptStyle: createAssistantPrompt,
		followUps: "dalle_gen",
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "chatting",
		},
		traits: {
			personality: ["artistic", "creative", "visionary"],
			strengths: ["making art", "coming up with creative ideas"],
			abilities: ["Generating images from text descriptions"],
		}, // Examples order: Human, AI, Human, AI, Human, AI
		examples: [
			"Hey DALL-E, make a painting of a cat.",
			"I'll have a painting of a cat coming right to you!\n" + "<prompt>A painting of a cat.</prompt>",
			"Make it have white fur and blue eyes.",
			"Sure, I can do that. Let me know if there's anything else you'd like to add.\n" +
				"<prompt>A painting of a cat with white fur and blue eyes.</prompt>",
			"Now give it an astronaut suit and make it float in deep space.",
			"Do you have any specific styles in mind? I can make it look like a painting, a drawing, photograph, or even imitate a famous artist.\n" +
				"<prompt>A painting of a cat with white fur and blue eyes sitting on an avocado chair.</prompt>",
		],
	},
	codex: {
		key: "codex",
		name: "Codex",
		icon: "code",
		promptStyle: createAssistantPrompt,
		followUps: "codex_gen",
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "chatting",
		},
		traits: {
			personality: ["analytical", "logical", "rational"],
			strengths: ["programming", "coding"],
			abilities: ["Generating code from text descriptions"],
		},
		examples: [],
	},
	coordinator: {
		key: "coordinator",
		name: "Coordinator",
		icon: "question_answer",
		promptStyle: createAssistantPrompt,
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "coordinator",
		},
		rules: {
			always: [
				"Only respond with the exact names of the assistant(s) that should respond to the user's message.",
				"Separate assistant names with commas if more than one assistant should respond.",
				"Take into careful consideration the assistant's personality, strengths, weaknesses, and abilities.",
				"Maintain the logical flow and consistency of the conversation.",
			],
		},
		examples: [
			"Hey Davinci",
			"Respond: Davinci\nIgnore: DALL-E, Codex",
			"Hey DALL-E, make a painting of a cat.",
			"Respond: DALL-E\nIgnore: Davinci, Codex",
			"Hey Codex, make a program that adds two numbers.",
			"Respond: Codex\nIgnore: Davinci, DALL-E",
		],
		extras: {
			willRespond: "Will respond",
			willIgnore: "Will ignore",
		},
		available: false,
	},
	dalle_gen: {
		key: "dalle_gen",
		name: "DALL-E",
		icon: "image",
		promptStyle: createPromptDalleGen,
		apiConfig: {
			apiReqType: "createImage",
			apiReqOpts: undefined,
		},
		available: false,
	},
};
