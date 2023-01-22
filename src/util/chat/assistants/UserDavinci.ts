import {UserAssistant} from "src/util/chat/assistants/UserAssistant";

export class UserDavinci extends UserAssistant {
	constructor() {
		super("davinci", "Davinci");
		this.defaultJoin = true;

		this.addTraits({
			personality: ["helpful"],
			strengths: ["providing general information"],
		})
	}
}
