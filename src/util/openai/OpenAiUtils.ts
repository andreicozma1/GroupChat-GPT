import {Configuration, OpenAIApi} from "openai";
import {CreateCompletionRequest, CreateImageRequest} from "openai/api";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ApiReqTypes} from "src/util/openai/ApiReqTypes";
import {ApiReqOpts} from "src/util/openai/ApiReqOpts";

export const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY,
};
export const openaiApi = new OpenAIApi(new Configuration(openAiConfig));

export type ApiOptsValidTypes = CreateCompletionRequest | CreateImageRequest;

export const makeApiRequest = async (ai: Assistant, prompt: string) => {
	const {apiReqType, apiReqOpts} = ai.apiConfig;
	const {func, defaultOpts} = ApiReqTypes[apiReqType];
	let opts = {...defaultOpts};
	if (apiReqOpts) {
		opts = {...opts, ...ApiReqOpts.defaults[apiReqOpts]};
		opts = {...opts, ...ApiReqOpts.custom[apiReqOpts]};
	}
	opts = {
		...opts,
		prompt,
	};
	console.warn("=> ai:");
	console.log(ai);
	console.warn("=> config:");
	console.log(opts);
	return await func(opts);
};
