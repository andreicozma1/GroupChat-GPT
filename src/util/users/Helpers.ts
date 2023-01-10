import {User} from "src/util/users/User";
import {ChatUserTypes} from "src/util/chat/ChatModels";
import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {createCodeBlock, createMarkdown} from "src/util/TextUtils";

export class UserDalleGen extends User {
	constructor() {
		super("dalle_gen", "DALL-E", ChatUserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.DALLE_GEN;
		this.promptConfig.promptType = "createPromptDalleGen";
		this.showInMembersInfo = false;
	}
}

export class UserCodexGen extends User {
	constructor() {
		super("codex_gen", "Codex", ChatUserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.CODEX_GEN
		this.promptConfig.queryWrapTag = "instructions";
		this.promptConfig.responseWrapTag = "markdown";
		this.promptConfig.promptType = "createPromptCodexGen";

		this.promptConfig.rules?.always?.push(
			"Use Markdown and wrap any code in a code block.",
			"Use a language identifier for the code block if possible.",
			"Before each code block, write a description or explanation of what the following code will do.",
		);
		this.promptConfig.examples = [
			// TODO: Use LeetCode Examples
			// ------------------------------------------------------------
			createMarkdown(
				"Language: Python",
				"1. Write a function that multiplies two numbers together.",
				"2. Run the an example with the numbers 5 and 6.",
				"3. Print the result.",
			),
			// ------------------------------------------------------------
			createMarkdown(
				"# Multiplying Numbers",
				"Language: Python",
				"## Function Definition",
				"First, we define a function called `multiply`, which takes two parameters, `a` and `b`.") +
			createCodeBlock(
				"python",
				"def multiply(a, b):",
				"\treturn a * b") +
			createMarkdown(
				"## Example",
				"Next, run the function with the numbers 5 and 6, and print the result.") +
			createCodeBlock("python",
				"result = multiply(5, 6)",
				"print(result)")
			// ------------------------------------------------------------
		]
		this.showInMembersInfo = false;
	}
}