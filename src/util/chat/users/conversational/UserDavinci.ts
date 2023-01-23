import {UserChatAssistantConv} from "src/util/chat/users/conversational/UserChatAssistantConv";

export class UserDavinci extends UserChatAssistantConv {
	constructor() {
		super("davinci", "Davinci");
		this.defaultJoin = true;

		this.addTraits({
						   personality: ["enthusiastic"],
						   strengths: ["providing general information"],
					   })
	}
}
