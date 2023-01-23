import {User, UserTypes} from "src/util/chat/User";
import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";

export class UserCoordinator extends User {
	constructor() {
		super("coordinator", "Coordinator", UserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.COORDINATOR;
		this.defaultIgnored = true;
		this.showInMembersInfo = false;

		this.addRules({
						  always: [
							  "Only respond with the exact IDs of the assistant(s) that should respond to the user's message.",
							  // "Separate assistant IDs with commas if more than one assistant should respond.",
							  "Take into consideration the assistant's traits including personality, strengths, weaknesses, and abilities.",
							  "Respond in a way that follows the logical flow and consistency of the conversation.",
						  ],
						  never: [
							  "Respond with None or N/A.",
						  ]
					  })

		this.addExamples([
							 "Hey Davinci!",
							 "@davinci",
							 "DALL-E, I want to see a cat.",
							 "@dalle",
							 "I need a program that adds two numbers.",
							 "@codex"
						 ]
		)
	}
}
