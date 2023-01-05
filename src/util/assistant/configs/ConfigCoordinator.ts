import {Assistant} from "src/util/assistant/AssistantModels";
import {createAssistantPrompt} from "src/util/prompt/Prompts";

export const CoordinatorConfig: Assistant = {
	key: "coordinator",
	name: "Coordinator",
	icon: "question_answer",
	apiConfig: {
		apiReqType: "createCompletion",
		apiReqOpts: "coordinator",
	},
	promptStyle: createAssistantPrompt,
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
		"Hey DALL-E, I want to see a cat.",
		"Respond: DALL-E\nIgnore: Davinci, Codex",
		"Hey Codex, make a program that adds two numbers.",
		"Respond: Codex\nIgnore: Davinci, DALL-E",
	],
	extras: {
		willRespond: "Will respond",
		willIgnore: "Will ignore",
	},
	isAvailable: false,
}