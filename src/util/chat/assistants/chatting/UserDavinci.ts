import {UserAssistant} from "src/util/chat/assistants/chatting/UserAssistant";

export class UserDavinci extends UserAssistant {
	constructor() {
		super("davinci", "Davinci");
		this.defaultJoin = true;

		this.addTraits({
						   personality: ["enthusiastic"],
						   strengths: ["providing general information"],
					   })
	}
}
