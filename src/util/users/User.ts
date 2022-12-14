import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {PromptConfig} from "src/util/prompt/PromptModels";

export enum UserTypes {
	HUMAN = "human",
	ASSISTANT = "assistant",
}

export class User {
	id: string;
	name: string;
	icon = "chat";
	type: UserTypes;
	apiReqConfig: ApiRequestConfigTypes | string = ApiRequestConfigTypes.CONVERSATION;
	promptConfig: PromptConfig;
	followupPromptHelperId?: string;
	showInMembersInfo = true;
	shouldIgnoreCache = false;

	constructor(id: string, name: string, type: UserTypes) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.promptConfig = {
			promptType: "createAssistantPrompt",
			// exampleQueryHeader: "{User Name}",
			responseHeader: this.name,
		};
		this.promptConfig.traits = {
			personality: [],
			strengths: [],
			weaknesses: [],
			abilities: [],
		}
		this.promptConfig.rules = {
			always: [
				"Strictly follow the rules of the conversation.",
			],
			never: [],
		}
	}
}

