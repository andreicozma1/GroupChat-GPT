import {ChatUser} from "src/util/assistant/AssistantModels";

export const ConfigUser: ChatUser = {
	id: "user",
	name: "Human",
	icon: "chat",
	apiReqConfig: "human",
	promptConfig: {
		promptType: "createAssistantPrompt",
	}
};
