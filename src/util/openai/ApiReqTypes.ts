import {CreateCompletionRequest, CreateImageRequest} from "openai/api";
import {ApiOptsValidTypes, openaiApi} from "src/util/openai/OpenAiUtils";

export const ApiReqTypes: { [key: string]: { func: any; defaultOpts: ApiOptsValidTypes } } = {
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