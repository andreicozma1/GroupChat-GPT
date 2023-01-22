import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {PromptConfig, PromptRules, PromptTraits} from "src/util/prompt/PromptBuilder";
import {merge} from "lodash-es";

export enum UserTypes {
	HUMAN = "human",
	ASSISTANT = "assistant",
	HELPER = "helper",
}

export class User {
	id: string;
	name: string;
	icon = "chat";
	type: UserTypes;
	apiReqConfig: ApiRequestConfigTypes | string =
		ApiRequestConfigTypes.CONVERSATION;
	showInMembersInfo = true;
	alwaysIgnoreCache = false;
	requiresUserIds: string[] = [];
	defaultJoin = false;
	defaultIgnored = false;
	promptConfig: PromptConfig;

	constructor(id: string, name: string, type: UserTypes) {
		this.id = id;
		this.id = this.id.replace(/\s/g, "");
		this.name = name;
		this.type = type;
		this.promptConfig = {
			responseHeader: this.name
		};
		this.promptConfig.traits = {
			personality: [],
			strengths: [],
			weaknesses: [],
			abilities: [],
		};
		this.promptConfig.rules = {
			always: ["Strictly follow the rules of the conversation."],
			never: [],
		};
		this.promptConfig.examples = [];
	}

	addTraits(traits: PromptTraits) {
		this.promptConfig.traits = merge(this.promptConfig.traits, traits);
	}

	addRules(rules: PromptRules) {
		this.promptConfig.rules = merge(this.promptConfig.rules, rules);
	}

	addExamples(examples: string[]) {
		// if length is not an even number, show error
		if (examples.length % 2 !== 0) {
			console.error("Number of examples must be an even number.");
			return;
		}
		this.promptConfig.examples?.push(...examples);
	}
}
