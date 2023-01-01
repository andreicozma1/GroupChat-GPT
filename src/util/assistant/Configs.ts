import { createAssistantPrompt } from "src/util/assistant/BaseAssistant";
import { createPromptCoordinator } from "src/util/assistant/BaseCoordinator";
import {
	basePersonalityTraits,
	baseStrengths,
	createPromptDalleGen,
	generationInstructions,
} from "src/util/assistant/Prompt";
import { AssistantConfig } from "src/util/assistant/Util";

export const ApiReqConfigs: { [key: string]: { [key: string]: any } } = {
	defaults: {
		chatting: {
			max_tokens: 250,
			temperature: 0.75,
			frequency_penalty: 0.0,
			presence_penalty: 0.6,
		},
		coordinator: {
			temperature: 0.6,
			max_tokens: 25,
		},
	},
	custom: {},
};

export const AssistantConfigs: Record<string, AssistantConfig> = {
	davinci: {
		key: "davinci",
		name: "Davinci",
		icon: "chat",
		promptStyle: createAssistantPrompt,
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "chatting",
		},
		traits: {
			personality: ["helpful", ...basePersonalityTraits],
			strengths: ["providing general information", ...baseStrengths],
		},
	},
	dalle: {
		key: "dalle",
		name: "DALL-E",
		icon: "image",
		promptStyle: createAssistantPrompt,
		followUps: "dalle_gen",
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "chatting",
		},
		traits: {
			personality: ["artistic", "creative", "visionary", ...basePersonalityTraits],
			strengths: ["making art", "coming up with creative ideas", ...baseStrengths],
			abilities: ["Generating images from text descriptions"],
		},
		instructions: [...generationInstructions],
	},
	codex: {
		key: "codex",
		name: "Codex",
		icon: "code",
		promptStyle: createAssistantPrompt,
		followUps: "codex_gen",
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "chatting",
		},
		traits: {
			personality: ["analytical", "logical", "rational", ...basePersonalityTraits],
			strengths: ["programming", "coding", ...baseStrengths],
			abilities: ["Generating code from text descriptions"],
		},
		instructions: [...generationInstructions],
	},
	coordinator: {
		key: "coordinator",
		name: "Coordinator",
		icon: "question_answer",
		promptStyle: createPromptCoordinator,
		apiConfig: {
			apiReqType: "createCompletion",
			apiReqOpts: "coordinator",
		},
		extras: {
			willRespond: "Will respond",
			willIgnore: "Will ignore",
		},
		available: false,
	},
	dalle_gen: {
		key: "dalle_gen",
		name: "DALL-E",
		icon: "image",
		promptStyle: createPromptDalleGen,
		apiConfig: {
			apiReqType: "createImage",
			apiReqOpts: undefined,
		},
		available: false,
	},
};
