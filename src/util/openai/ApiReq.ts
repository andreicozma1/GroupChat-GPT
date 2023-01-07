import {CreateCompletionRequest, CreateImageRequest} from "openai/api";
import {Assistant} from "src/util/assistant/AssistantModels";
import {openaiApi} from "src/util/openai/OpenAiUtils";

export type ApiOptsValidTypes = CreateCompletionRequest | CreateImageRequest;

export interface ApiReqConfigBase {
	func: any;
	opts: ApiOptsValidTypes;
}

export interface ApiReqConfigVariant {
	parent: string;
	opts?: any;
}

export interface ApiReqConfigs {
	base: { [key: string]: ApiReqConfigBase };
	defaults: { [key: string]: ApiReqConfigVariant };
	custom: { [key: string]: ApiReqConfigVariant };
}

// TODO: Move this into a store
export const ApiReqMap: ApiReqConfigs = {
	base: {
		createCompletion: {
			func: (opts: CreateCompletionRequest) => openaiApi.createCompletion(opts),
			opts: {
				model: "text-davinci-003",
				max_tokens: 250,
				temperature: 0.75,
				top_p: 1,
				frequency_penalty: 0.0,
				presence_penalty: 0.0,
				stop: ["###"],
			},
		},
		createImage: {
			func: (opts: CreateImageRequest) => openaiApi.createImage(opts),
			opts: {
				n: 1,
				size: "256x256",
				prompt: "This prompt is a placeholder",
			},
		},
	},
	defaults: {
		coordinator: {
			parent: "createCompletion",
			opts: {
				temperature: 0.6,
				max_tokens: 25,
			}
		},
		assistant: {
			parent: "createCompletion",
			opts: {
				max_tokens: 250,
				temperature: 0.75,
				frequency_penalty: 0.0,
				presence_penalty: 0.6,
			}
		},
		codex_gen: {
			parent: "createCompletion",
			opts: {
				model: "code-davinci-002",
				max_tokens: 500,
			}
		},
		dalle_gen: {
			parent: "createImage",
		},
	},
	custom: {},
};

export const makeApiRequest = async (ai: Assistant, prompt: string) => {
	const apiConfigKey = ai.apiReqConfig;
	console.warn("=> makeApiRequest:", apiConfigKey);
	// Recursively build the final config
	const configs = {
		...ApiReqMap.defaults,
		...ApiReqMap.custom,
	};
	// Start from the topmost parent and work our way down to the ai's config
	let config: ApiReqConfigBase = ApiReqMap.base.createCompletion;
	const sequence = [];
	let current = ai.apiReqConfig
	while (current) {
		sequence.push(current);
		if (configs[current]) {
			current = configs[current].parent;
			continue
		}
		if (ApiReqMap.base[current]) {
			config = ApiReqMap.base[current];
			break;
		}
		throw new Error(`Could not find parent config for ${current}`);
	}
	sequence.reverse();
	console.log("=> sequence:", sequence);
	sequence.forEach((c) => {
		const cfg = configs[c] || ApiReqMap.base[c];
		console.log("=> config:", c, cfg);
		config.opts = {
			...config.opts,
			...cfg.opts,
		}
	});
	config.opts = {
		...config.opts,
		prompt,
	}
	console.log("=> config:", config);
	return await config.func(config.opts);
};