import {Configuration, OpenAIApi} from "openai";

export const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY,
};
export const openaiApi = new OpenAIApi(new Configuration(openAiConfig));

