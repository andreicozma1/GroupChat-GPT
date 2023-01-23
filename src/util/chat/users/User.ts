import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {PromptConfig, PromptRules, PromptTraits} from "src/util/prompt/PromptBuilder";
import {merge} from "lodash-es";
import {getRobohashUrl} from "src/util/ImageUtils";
import {getRegexValidUserId} from "src/util/RegexUtils";
import {Thread} from "src/util/chat/Thread";

export enum UserTypes {
	HUMAN = "human",
	ASSISTANT = "assistant",
	HELPER = "helper",
}

export const assistantFilter = (user?: User) =>
	!user || user.type === UserTypes.ASSISTANT || user.type === UserTypes.HELPER;

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
	promptConfig: PromptConfig = {}

	constructor(id: string, name: string, type: UserTypes) {
		this.id = id;
		// if there are any invalid characters in the user name, throw an error
		// valid characters are a-z, A-Z, 0-9, _, -, and .
		if (!getRegexValidUserId().test(this.id)) {
			throw new Error(
				`Invalid user name: ${this.id}. User names can only contain letters, numbers, underscores, dashes, and periods.`
			);
		}
		this.id = this.id.replace(/\s/g, "");
		this.name = name;
		this.type = type;
	}

	addTraits(traits: PromptTraits) {
		if (!this.promptConfig.traits) {
			// default traits
			this.promptConfig.traits = {
				personality: [],
				strengths: [],
				weaknesses: [],
				abilities: [],
			};
		}
		this.promptConfig.traits = merge(this.promptConfig.traits, traits);
	}

	addRules(rules: PromptRules) {
		if (!this.promptConfig.rules) {
			// default rules
			this.promptConfig.rules = {
				always: [],
				never: [],
				sometimes: [],
			};
		}
		this.promptConfig.rules = merge(this.promptConfig.rules, rules);
	}

	addExamples(examples: string[]) {
		// if length is not an even number, show error
		if (examples.length % 2 !== 0) {
			console.error("Number of examples must be an even number.");
			return;
		}
		if (!this.promptConfig.examples) {
			// default examples
			this.promptConfig.examples = [];
		}
		this.promptConfig.examples?.push(...examples);
	}

	getPromptStart(thread: Thread): string | undefined {
		return undefined;
	}

	getUserAvatarUrl() {
		return getRobohashUrl(this.name);
	}
}
