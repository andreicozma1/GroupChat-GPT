import { CreateCompletionRequest, CreateImageRequest } from "openai/api";
import { createAssistantPrompt } from "src/util/assistant/BaseAssistant";
import { createPromptCoordinator } from "src/util/assistant/BaseCoordinator";
import {
	basePersonalityTraits,
	baseStrengths,
	createPromptDalleGen,
	generationInstructions,
} from "src/util/assistant/Prompt";
import { AssistantConfig } from "src/util/assistant/Util";
import { openai } from "src/util/OpenAi";

export type ApiOptsValidTypes = CreateCompletionRequest | CreateImageRequest;
export const ApiReqMap: { [key: string]: { func: any; defaultOpts: ApiOptsValidTypes } } = {
	createCompletion: {
		func: openai.createCompletion,
		defaultOpts: {
			model: "text-davinci-003",
			max_tokens: 200,
			temperature: 0.75,
			top_p: 1,
			frequency_penalty: 0.0,
			presence_penalty: 0.0,
			stop: ["###"],
		},
	},
	createImage: {
		func: openai.createImage,
		defaultOpts: {
			n: 1,
			size: "256x256",
			prompt: "A photo of a realistic cat",
		},
	},
};

export const ApiReqConfigs: { [key: string]: { [key: string]: { type: string; opts: ApiOptsValidTypes } } } = {
	defaults: {
		chatting: {
			type: "createCompletion",
			opts: {
				model: "text-davinci-003",
				max_tokens: 200,
				temperature: 0.75,
				top_p: 1,
				frequency_penalty: 0.0,
				presence_penalty: 0.6,
				stop: ["###"],
			},
		},
		coordinator: {
			type: "createCompletion",
			opts: {
				model: "text-davinci-003",
				temperature: 0.75,
				max_tokens: 25,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				stop: ["###"],
			},
		},
	},
	custom: {},
};

export const getApiOpts = (configName: string): ApiOptsValidTypes => {
	// first check if the config is in the custom configs
	if (ApiReqConfigs.custom[configName]) return ApiReqConfigs.custom[configName];
	// if not, check if it's in the default configs
	if (ApiReqConfigs.defaults[configName]) return ApiReqConfigs.defaults[configName];
	// if not, throw an error
	throw new Error(`No API config found for ${configName}`);
};

export const AssistantConfigs: Record<string, AssistantConfig> = {
	davinci: {
		key: "davinci",
		name: "Davinci",
		icon: "chat",
		createPrompt: createAssistantPrompt,
		config: "chatting",
		personality: ["helpful", ...basePersonalityTraits],
		strengths: ["providing general information", ...baseStrengths],
	},
	dalle: {
		key: "dalle",
		name: "DALL-E",
		icon: "image",
		createPrompt: createAssistantPrompt,
		createGen: "dalle_gen",
		config: "chatting",
		personality: ["artistic", "creative", "visionary", ...basePersonalityTraits],
		strengths: ["making art", "coming up with creative ideas", ...baseStrengths],
		abilities: ["Generating images from text descriptions"],
		instructions: [...generationInstructions],
	},
	codex: {
		key: "codex",
		name: "Codex",
		icon: "code",
		createPrompt: createAssistantPrompt,
		createGen: "codex_gen",
		config: "chatting",
		personality: ["analytical", "logical", "rational", ...basePersonalityTraits],
		strengths: ["programming", "coding", ...baseStrengths],
		abilities: ["Generating code from text descriptions"],
		instructions: [...generationInstructions],
	},
	coordinator: {
		key: "coordinator",
		name: "Coordinator",
		icon: "question_answer",
		createPrompt: createPromptCoordinator,
		config: "coordinator",
		vals: {
			willRespond: "Will Respond",
			willIgnore: "Will Ignore",
		},
		available: false,
	},
	dalle_gen: {
		key: "dalle_gen",
		name: "DALL-E",
		icon: "image",
		createPrompt: createPromptDalleGen,
		config: "dalle_gen",
		available: false,
	},
};
