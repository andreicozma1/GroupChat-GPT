import {Assistant} from "src/util/assistant/AssistantModels";
import {createAssistantPrompt} from "src/util/prompt/AssistantPrompts";

// TODO: Use this generic config in the prompt creation functions
export const ConfigAssistantBase: Assistant = {
	id: "generic",
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
		always: [
			"follow the user's instructions, requests, and answer their questions if appropriate to do so.",
		],
		never: [
			"respond to other assistant's questions, but may acknowledge their presence and offer insight into the conversation",
		],
	},
};
