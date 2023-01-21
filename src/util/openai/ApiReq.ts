import {CreateCompletionRequest, CreateImageRequest} from "openai/api";
import {openAiApi} from "src/util/openai/OpenAiApi";

export type ApiOptsValidTypes = CreateCompletionRequest | CreateImageRequest;

interface IApiRequestConfigBase {
	func: any;
	opts: ApiOptsValidTypes;
}

interface IApiRequestConfigVariant {
	parent: string;
	opts?: any;
}

interface ApiRequestConfigs {
	base: { [key: string]: IApiRequestConfigBase };
	defaults: { [key: string]: IApiRequestConfigVariant };
	custom: { [key: string]: IApiRequestConfigVariant };
}

export enum ApiRequestConfigTypes {
	COORDINATOR = "coordinator",
	ASSISTANT = "assistant",
	CONVERSATION = "conversation",
	HUMAN = "human",

	CODEX_GEN = "codex_gen",
	DALLE_GEN = "dalle_gen",
}

// TODO: Move this into a store
export const ApiRequestConfigsMap: ApiRequestConfigs = {
	base: {
		createCompletion: {
			func: (opts: CreateCompletionRequest) => openAiApi.createCompletion(opts),
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
			func: (opts: CreateImageRequest) => openAiApi.createImage(opts),
			opts: {
				n: 1,
				size: "256x256",
				prompt: "This prompt is a placeholder",
			},
		},
	},
	defaults: {
		[ApiRequestConfigTypes.COORDINATOR]: {
			parent: "createCompletion",
			opts: {
				temperature: 0.8,
				max_tokens: 25,
			},
		},
		[ApiRequestConfigTypes.ASSISTANT]: {
			parent: "createCompletion",
			opts: {
				max_tokens: 250,
				temperature: 0.75,
				frequency_penalty: 0.0,
				presence_penalty: 0.0,
			},
		},
		[ApiRequestConfigTypes.CONVERSATION]: {
			parent: ApiRequestConfigTypes.ASSISTANT,
			opts: {
				presence_penalty: 0.6,
			},
		},
		[ApiRequestConfigTypes.HUMAN]: {
			parent: ApiRequestConfigTypes.CONVERSATION,
		},
		[ApiRequestConfigTypes.CODEX_GEN]: {
			parent: "createCompletion",
			opts: {
				model: "code-davinci-002",
				max_tokens: 500,
			},
		},
		[ApiRequestConfigTypes.DALLE_GEN]: {
			parent: "createImage",
		},
	},
	custom: {},
};

export const makeApiRequest = async (apiReqConfig: string, prompt: string) => {
	console.warn("makeApiRequest->apiReqConfig:", apiReqConfig);
	// Recursively build the final config
	const configs = {
		...ApiRequestConfigsMap.defaults,
		...ApiRequestConfigsMap.custom,
	};
	// Start from the topmost parent and work our way down to the ai's config
	let config: IApiRequestConfigBase =
		ApiRequestConfigsMap.base.createCompletion;
	const sequence = [];
	while (apiReqConfig) {
		sequence.push(apiReqConfig);
		if (configs[apiReqConfig]) {
			apiReqConfig = configs[apiReqConfig].parent;
			continue;
		}
		if (ApiRequestConfigsMap.base[apiReqConfig]) {
			config = ApiRequestConfigsMap.base[apiReqConfig];
			break;
		}
		throw new Error(`Could not find parent config for ${apiReqConfig}`);
	}
	sequence.reverse();
	console.log("=> sequence:", sequence);
	sequence.forEach((c) => {
		const cfg = configs[c] || ApiRequestConfigsMap.base[c];
		console.log("=> config:", c, cfg);
		config.opts = {
			...config.opts,
			...cfg.opts,
		};
	});
	config.opts = {
		...config.opts,
		prompt,
	};
	console.log("=> config:", config);
	return await config.func(config.opts);
};
