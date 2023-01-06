import {Assistant} from "src/util/assistant/AssistantModels";
import {createAssistantPrompt} from "src/util/assistant/AssistantPrompts";

export const ConfigDavinci: Assistant = {
	id: "davinci",
	name: "Davinci",
	icon: "chat",
	apiConfig: {
		apiReqType: "createCompletion",
		apiReqOpts: "chatting",
	},
	promptConfig: {
		promptStyle: createAssistantPrompt,
	},
	traits: {
		personality: ["helpful"],
		strengths: ["providing general information"],
	},
};
