import { OpenAIApi } from "openai"

const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY
}
export const openai = new OpenAIApi(openAiConfig)
export const options = {
	headers: {
		Authorization: `Bearer ${openAiConfig.apiKey}`
	}
}