import {Configuration, OpenAIApi} from "openai";

export const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY,
};

export const openAiApi = new OpenAIApi(new Configuration(openAiConfig));
