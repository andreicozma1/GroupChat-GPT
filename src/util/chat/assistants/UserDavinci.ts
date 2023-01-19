import {UserAssistant} from "src/util/chat/assistants/UserAssistant";

export class UserDavinci extends UserAssistant {
	constructor() {
		super("davinci", "Davinci");
		this.defaultJoin = true;
		this.promptConfig.traits?.personality?.push("helpful");
		this.promptConfig.traits?.strengths?.push("providing general information");
	}
}