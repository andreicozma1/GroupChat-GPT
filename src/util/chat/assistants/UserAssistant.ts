import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {User, UserTypes} from "src/util/chat/User";

export const assistantFilter = (user?: User) =>
	!user || user.type === UserTypes.ASSISTANT || user.type === UserTypes.HELPER;

export class UserAssistant extends User {
	constructor(id: string, name: string) {
		super(id, name, UserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.CONVERSATION;
		this.promptConfig.responseHeader = this.name;
		this.promptConfig.traits = {
			personality: ["friendly", "polite", "truthful"],
			strengths: ["making conversation", "answering questions"],
			weaknesses: [],
			abilities: [],
		};
		this.promptConfig.rules = {
			always: [
				"Follow instructions, requests, and answer questions if appropriate to do so.",
			],
			never: ["Respond to other assistants or on behalf of other assistants."],
		};
	}
}
