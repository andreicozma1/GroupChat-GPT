import {UserChattingAssistant} from "src/util/chat/assistants/UserChattingAssistant";

export class UserDavinci extends UserChattingAssistant {
	constructor() {
		super("davinci", "Davinci");
		this.defaultJoin = true;

		this.addTraits({
						   personality: ["enthusiastic"],
						   strengths: ["providing general information"],
					   })
	}
}
