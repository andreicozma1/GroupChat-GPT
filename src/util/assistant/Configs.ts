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

const BaseAssistantApiConfig = {
	model: "text-davinci-003",
	max_tokens: 200,
	temperature: 0.75,
	top_p: 1,
	frequency_penalty: 0.0,
	presence_penalty: 0.6,
	stop: ["###"],
};
export const actors: Record<string, AssistantConfig> = {
	davinci: {
		key: "davinci",
		name: "Davinci",
		icon: "chat",
		createPrompt: createAssistantPrompt,
		apiConfig: {
			...BaseAssistantApiConfig,
		},
		personality: ["helpful", ...basePersonalityTraits],
		strengths: ["providing general information", ...baseStrengths],
	},
	dalle: {
		key: "dalle",
		name: "DALL-E",
		icon: "image",
		createPrompt: createAssistantPrompt,
		createGen: "dalle_gen",
		apiConfig: {
			...BaseAssistantApiConfig,
		},
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
		apiConfig: {
			...BaseAssistantApiConfig,
		},
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
		apiConfig: {
			model: "text-davinci-003",
			temperature: 0.75,
			max_tokens: 25,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["###"],
		},
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
		createComp: openai.createImage,
		apiConfig: {
			n: 1,
			size: "256x256",
			prompt: "A cute puppy", // this is just a placeholder so that IDEs don't complain
		},
		available: false,
	},
};
