import {ChatUserTypes} from "src/util/chat/ChatModels";
import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {createCodeBlock, createExamplePrompt, createMarkdown} from "src/util/assistant/AssistantUtils";

export interface PromptConfig {
	promptType: string;
	traits?: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; // Order: Human, AI, Human, AI, etc.
	exampleQueryHeader?: string;
	responseHeader: string;
	queryWrapTag?: string;
	responseWrapTag?: string;
}

export interface PromptTraits {
	personality?: string[];
	strengths?: string[];
	weaknesses?: string[];
	abilities?: string[];
}

export interface PromptRules {
	always?: string[];
	never?: string[];
}

export class ChatUser {
	id: string;
	name: string;
	icon = "chat";
	type: ChatUserTypes;
	apiReqConfig: ApiRequestConfigTypes | string = ApiRequestConfigTypes.CONVERSATION;
	promptConfig: PromptConfig;
	followupPromptHelperId?: string;
	showInMembersInfo = true;
	shouldIgnoreCache = false;

	constructor(id: string, name: string, type: ChatUserTypes) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.promptConfig = {
			promptType: "createAssistantPrompt",
			// exampleQueryHeader: "{User Name}",
			responseHeader: this.name,
		};
		this.promptConfig.traits = {
			personality: [],
			strengths: [],
			weaknesses: [],
			abilities: [],
		}
		this.promptConfig.rules = {
			always: [
				"Strictly follow the rules of the conversation.",
			],
			never: [],
		}
	}
}

export class ChatUserHuman extends ChatUser {
	constructor(id: string, name: string) {
		super(id, name, ChatUserTypes.HUMAN);
		this.apiReqConfig = ApiRequestConfigTypes.HUMAN;
		this.showInMembersInfo = false;
	}
}

export class ChatUserAssistant extends ChatUser {
	constructor(id: string, name: string) {
		super(id, name, ChatUserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.CONVERSATION;
		this.promptConfig.responseHeader = this.name;
		this.promptConfig.traits = {
			personality: ["friendly", "polite", "truthful"],
			strengths: ["making conversation", "answering questions"],
			weaknesses: [],
			abilities: [],
		}
		this.promptConfig.rules = {
			always: [
				"Follow instructions, requests, and answer questions if appropriate to do so.",
			],
			never: [
				"Respond to other assistants or on behalf of other assistants.",
			],
		}
	}
}

export class ChatUserDavinci extends ChatUserAssistant {
	constructor() {
		super("davinci", "Davinci");
		this.promptConfig.traits?.personality?.push("helpful");
		this.promptConfig.traits?.strengths?.push("providing general information");
	}
}

export class ChatUserDalle extends ChatUserAssistant {
	constructor() {
		super("dalle", "DALL-E");
		this.promptConfig.traits?.personality?.push("artistic", "creative", "visionary");
		this.promptConfig.traits?.strengths?.push("making art", "coming up with creative ideas");
		this.promptConfig.traits?.abilities?.push("generating images based on text descriptions and prompts");

		this.followupPromptHelperId = "dalle_gen";
		this.promptConfig.examples = [
			// ------------------------------------------------------------
			"Hey DALL-E, I want to see a picture cat.",
			// ------------------------------------------------------------
			"Sure! Here is a picture of a cat.\n" +
			"Do you want to see a specific color or breed? Like a black cat or a tabby?\n" +
			"Also, should the cat be sitting, standing, or perhaps playing with a ball of yarn?\n" +
			"Let me know if there is anything else you want to add.\n" +
			createExamplePrompt("A picture of a cat."),
			// ------------------------------------------------------------
			"Tabby, sitting on a chair. Also, give it a cowboy hat.",
			// ------------------------------------------------------------
			"Sure, I can do that.\n" +
			"Do you have any specific artistic styles in mind? Like a cartoon, oil painting, or realistic style?\n" +
			"I can also try to imitate a specific artist.\n" +
			createExamplePrompt("A picture of a tabby cat, sitting on a chair, wearing a cowboy hat."),
			// ------------------------------------------------------------
			"Surprise me!",
			// ------------------------------------------------------------
			"How about a cartoon style?\n" +
			createExamplePrompt("A picture of a tabby cat, sitting on a chair, wearing a cowboy hat, cartoon style."),
		];
	}
}


// export const ConfigDalleGen: ChatUser = {
// 	id: "dalle_gen",
// 	name: "DALL-E",
// 	icon: "image",
// 	apiReqConfig: "dalle_gen",
// 	promptConfig: {
// 		promptType: "createPromptDalleGen",
// 	},
// 	isAvailable: false,
// }

export class ChatUserDalleGen extends ChatUser {
	constructor() {
		super("dalle_gen", "DALL-E", ChatUserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.DALLE_GEN;
		this.promptConfig.promptType = "createPromptDalleGen";
		this.showInMembersInfo = false;
	}
}

export class ChatUserCoordinator extends ChatUser {
	constructor() {
		super("coordinator", "Coordinator", ChatUserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.COORDINATOR
		this.promptConfig.rules?.always?.push(
			"Only respond with the exact names of the assistant(s) that should respond to the user's message.",
			"Separate assistant names with commas if more than one assistant should respond.",
			"Take into careful consideration the assistant's traits including personality, strengths, weaknesses, and abilities.",
			"Maintain the logical flow and consistency of the conversation.")
		this.promptConfig.rules?.never?.push(
			"Respond with None or N/A."
		)
		this.promptConfig.examples = [
			"Hey Davinci",
			"Ignore: DALL-E, Codex\nRespond: Davinci",
			"Hey DALL-E, I want to see a cat.",
			"Ignore: Davinci, Codex\nRespond: DALL-E",
			"Hey Codex, make a program that adds two numbers.",
			"Ignore: Davinci, DALL-E\nRespond: Codex",
		];
		this.showInMembersInfo = false;
	}
}


export class ChatUserCodex extends ChatUserAssistant {
	constructor() {
		super("codex", "Codex");
		this.promptConfig.traits?.personality?.push("analytical", "logical", "rational");
		this.promptConfig.traits?.strengths?.push("programming", "coding");
		this.promptConfig.traits?.abilities?.push("generating code based on text descriptions and prompts");

		this.promptConfig.rules?.never?.push("Write the code yourself.");
		this.promptConfig.rules?.always?.push("Only generate the prompt with instructions.");
		this.promptConfig.examples = [
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
		];
		this.followupPromptHelperId = "codex_gen";
	}
}


export class ChatUserCodexGen extends ChatUser {
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

// TODO: Find better name for these and move them to a separate file
export interface ProcessKVConfig {
	keyPrefix?: string;
	valJoinStr?: string;
	inline?: boolean;
	commaSepMinChars?: number;
	valPrefix?: string;
}
