import {ChatUser} from "src/util/assistant/AssistantModels";

export const ConfigDavinci: ChatUser = {
	id: "davinci",
	name: "Davinci",
	icon: "chat",
	apiReqConfig: "assistant",
	promptConfig: {
		promptType: "createAssistantPrompt",
		traits: {
			personality: ["helpful"],
			strengths: ["providing general information"],
		},
	},
};
