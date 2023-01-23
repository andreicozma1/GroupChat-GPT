import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {UserChatAssistant} from "src/util/chat/users/UserChatAssistant";

export class UserCoordinator extends UserChatAssistant {
	constructor() {
		super("coordinator", "Coordinator");
		this.apiReqConfig = ApiRequestConfigTypes.COORDINATOR;
		this.defaultIgnored = true;
		this.showInMembersInfo = false;

		this.addRules({
						  always: [
							  "Only respond with the exact IDs of the assistant(s) that should respond to the user's message.",
							  // "Separate assistant IDs with commas if more than one assistant should respond.",
							  "Take into consideration the assistant's traits including personality, strengths, weaknesses, and abilities.",
							  "Only respond with the last user when the user uses the words 'you' or 'yourself'.",
						  ],
						  never: [
							  "Respond with None or N/A.",
							  "Break the flow of the conversation between the user and an assistant.",
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
