import { Configuration, OpenAIApi } from "openai";
import { CreateCompletionRequest, CreateImageRequest } from "openai/api";
import { ApiReqConfigs } from "src/util/assistant/Configs";
import { AssistantConfig } from "src/util/assistant/Util";

export const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY,
};
export const openaiApi = new OpenAIApi(new Configuration(openAiConfig));

export type ApiOptsValidTypes = CreateCompletionRequest | CreateImageRequest;

export const ApiReqMap: { [key: string]: { func: any; defaultOpts: ApiOptsValidTypes } } = {
	createCompletion: {
		func: (opts: CreateCompletionRequest) => openaiApi.createCompletion(opts),
		defaultOpts: {
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
		defaultOpts: {
			n: 1,
			size: "256x256",
			prompt: "This prompt is a placeholder",
		},
	},
};

export const makeApiRequest = async (actor: AssistantConfig, prompt: string) => {
	const { apiReqType, apiReqOpts } = actor.apiConfig;
	const { func, defaultOpts } = ApiReqMap[apiReqType];
	let opts = { ...defaultOpts };
	if (apiReqOpts) {
		opts = { ...opts, ...ApiReqConfigs.defaults[apiReqOpts] };
		opts = { ...opts, ...ApiReqConfigs.custom[apiReqOpts] };
	}
	opts = {
		...opts,
		prompt,
	};
	console.warn("=> config:");
	console.log(opts);
	return await func(opts);
};
