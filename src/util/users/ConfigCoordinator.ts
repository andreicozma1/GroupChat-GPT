import {ChatUser} from "src/util/assistant/AssistantModels";

export const ConfigCoordinator: ChatUser = {
	id: "coordinator",
	name: "Coordinator",
	icon: "question_answer",
	apiReqConfig: "coordinator",
	promptConfig: {
		promptType: "createAssistantPrompt",
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
			"Ignore: DALL-E, Codex\nRespond: Davinci",
			"Hey DALL-E, I want to see a cat.",
			"Ignore: Davinci, Codex\nRespond: DALL-E",
			"Hey Codex, make a program that adds two numbers.",
			"Ignore: Davinci, DALL-E\nRespond: Codex",
		],
	},
	extras: {
		willRespond: "Will respond",
		willIgnore: "Will ignore",
	},
	isAvailable: false,
	defaultHidden: false,
};
