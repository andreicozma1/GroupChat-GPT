import { Configuration, OpenAIApi } from "openai";
import { CreateCompletionRequest, CreateImageRequest } from "openai/api";
import { ApiReqConfigs } from "src/util/assistant/Configs";
import { AssistantConfig } from "src/util/assistant/Util";

export const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY,
};
export const openaiApi = new OpenAIApi(new Configuration(openAiConfig));

export const axiosReqConfig = {
	headers: {
		Authorization: `Bearer ${openAiConfig.apiKey}`,
	},
};

export type ApiOptsValidTypes = CreateCompletionRequest | CreateImageRequest;

export const ApiReqMap: { [key: string]: { func: any; defaultOpts: ApiOptsValidTypes } } = {
	createCompletion: {
		func: openaiApi.createCompletion,
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
		func: openaiApi.createImage,
		defaultOpts: {
			n: 1,
			size: "256x256",
			prompt: "A photo of a realistic cat",
		},
	},
};

export const makeApiRequest = async (actor: AssistantConfig, prompt: string) => {
	const { apiReqType, apiReqOpts } = actor.apiConfig;
	const { func, defaultOpts } = ApiReqMap[apiReqType];
	// try to grab from custom or default configs
	// then merge with default opts
	let opts = { ...defaultOpts };
	if (apiReqOpts) {
		opts = { ...opts, ...ApiReqConfigs.defaults[apiReqOpts] };
		opts = { ...opts, ...ApiReqConfigs.custom[apiReqOpts] };
	}
	// then make the request
	const res = await openaiApi.createCompletion({
		...opts,
		prompt,
	});
	return res;
};
