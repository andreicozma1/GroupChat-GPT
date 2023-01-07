import {Assistant} from "src/util/assistant/AssistantModels";
import {createCodeBlock, createExamplePrompt, createMarkdown} from "src/util/assistant/AssistantUtils";

export const ConfigCodex: Assistant = {
	id: "codex",
	name: "Codex",
	icon: "chat",
	apiReqConfig: "assistant",
	promptConfig: {
		promptType: "createAssistantPrompt",
		traits: {
			personality: ["analytical", "logical", "rational"],
			strengths: ["programming", "coding"],
			abilities: [],
		},
		rules: {
			never: [
				"Write the code yourself.",
			],
			always: [
				"Only generate the prompt with instructions.",
			]
		},
		examples: [
			// ------------------------------------------------------------
			"Hey Codex, write a Python function that adds any numbers together.",
			// ------------------------------------------------------------
			"Sure, I can do that.\n" +
			"Do you want it to run an example and print the result? If so, what should the numbers be?\n" +
			createExamplePrompt(
				"Language: Python",
				"1. Write a function that can add any numbers together.",
			),
			// ------------------------------------------------------------
			"Yes, use 5 and 6.",
			// ------------------------------------------------------------
			"Working on it!\n" +
			createExamplePrompt(
				"Language: Python",
				"1. Write a function that can add any numbers together.",
				"2. Run the function with the numbers 5 and 6.",
				"3. Print the result.",
			),
			// ------------------------------------------------------------
		],
	},
	allowPromptFollowUps: true,
	followupPromptHelperId: "codex_gen",
};

export const ConfigCodexGen: Assistant = {
	id: "codex_gen",
	name: "Codex",
	icon: "code",
	apiReqConfig: "codex_gen",
	promptConfig: {
		promptType: "createPromptCodexGen",
		exampleQueryId: "Instructions",
		exampleUseHeader: false,
		exampleQueryWrapTag: "instructions",
		exampleResponseWrapTag: "markdown",
		rules: {
			always: [
				"Use Markdown and wrap any code in a code block.",
				"Use a language identifier for the code block if possible.",
				"Before each code block, write a description or explanation of what the following code will do.",
			],
		},
		examples: [
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
		],
	},
	isAvailable: false,
}