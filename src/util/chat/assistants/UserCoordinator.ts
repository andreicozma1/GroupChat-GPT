import {User, UserTypes} from "src/util/chat/User";
import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";

export class UserCoordinator extends User {
	constructor() {
		super("coordinator", "Coordinator", UserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.COORDINATOR;
		this.defaultIgnored = true;
		this.promptConfig.rules?.always?.push(
			"Only respond with the exact IDs of the assistant(s) that should respond to the user's message.",
			// "Separate assistant IDs with commas if more than one assistant should respond.",
			"Take into consideration the assistant's traits including personality, strengths, weaknesses, and abilities.",
			"Maintain the logical flow and consistency of the conversation."
		);
		this.promptConfig.rules?.never?.push("Respond with None or N/A.");
		this.promptConfig.examples = [
			"Hey Davinci!",
			"@davinci",
			"DALL-E, I want to see a cat.",
			"@dalle",
			"I need a program that adds two numbers.",
			"@codex",
		];
		// this.promptConfig.examples = [
		// 	"Hey Davinci",
		// 	getNewlineSeparated(
		// 		"Ignore: @dalle, @codex",
		// 		"Respond: @davinci"
		// 	),
		// 	"Hey DALL-E, I want to see a cat.",
		// 	getNewlineSeparated(
		// 		"Ignore: @davinci, @codex",
		// 		"Respond: @dalle",
		// 	),
		// 	"Hey Codex, make a program that adds two numbers.",
		// 	getNewlineSeparated(
		// 		"Ignore: @davinci, @dalle",
		// 		"Respond: @codex",
		// 	),
		// ];
		this.showInMembersInfo = false;
	}
}
