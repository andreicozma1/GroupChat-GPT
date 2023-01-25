import {PromptConfig, PromptRules, PromptTraits} from "src/util/prompt/PromptBuilder";
import {getRobohashUrl} from "src/util/ImageUtils";
import {getRegexValidUserId} from "src/util/RegexUtils";
import {Thread} from "src/util/chat/Thread";
import {smartNotify} from "src/util/SmartNotify";
import {merge} from "lodash-es";
import {ApiReqTypes} from "src/util/openai/ApiReq";

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
	apiReqType: ApiReqTypes = ApiReqTypes.OAI_CREATE_COMPLETION;
	apiReqOpts: any = {
		model: "text-davinci-003",
		max_tokens: 250,
		temperature: 0.75,
		top_p: 1,
		frequency_penalty: 0.0,
		presence_penalty: 0.0,
		stop: ["####"]
	}
	showInMembersInfo = true;
	alwaysIgnoreCache = false;
	// requiresUserIds: string[] = [];
	helper: string | undefined = undefined;
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

	static wrapInTag(tag: string, ...msgPrompt: string[]) {
		return [`<${tag}>`, ...msgPrompt, `</${tag}>`].join("\n");
	}

	updateArrayDict(oldDict: any, newDict: any) {
		for (const key in newDict) {
			if (oldDict[key]) {
				oldDict[key].push(...newDict[key]);
			} else {
				oldDict[key] = newDict[key];
			}
		}
	}

	updateApiReqOpts(opts: any) {
		merge(this.apiReqOpts, opts);
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
		this.updateArrayDict(this.promptConfig.traits, traits);
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
		this.updateArrayDict(this.promptConfig.rules, rules);
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

	wrapInHelperTag(...msgPrompt: string[]) {
		if (!this.helper) {
			smartNotify(`Warning: User ${this.name} requires a helper but it is not defined.`,
						'Please report this bug on the GitHub Issues page.');
			return msgPrompt.join("\n");
		}
		return User.wrapInTag(this.helper, ...msgPrompt);
	}

}
