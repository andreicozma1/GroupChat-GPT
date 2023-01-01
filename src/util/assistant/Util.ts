import { AssistantConfigs } from "src/util/assistant/Configs";

export interface AssistantRules {
	always?: string | string[];
	never?: string | string[];
}

export interface AssistantTraits {
	personality?: string | string[];
	strengths?: string | string[];
	weaknesses?: string | string[];
	abilities?: string | string[];
}

export interface AssistantConfig {
	key: string;
	name: string;
	icon: string;
	promptStyle: any;
	apiConfig: {
		apiReqType: string; apiReqOpts?: string;
	};
	traits?: AssistantTraits;
	rules?: AssistantRules;
	// Order: Human, AI, Human, AI, etc.
	examples?: string[];
	extras?: {
		[key: string]: any;
	};
	followUps?: string | string[];
	available?: boolean;
	ignoreCache?: boolean;
}

export const getAvailable = (): AssistantConfig[] => {
	return Object.values(AssistantConfigs).filter((a) => {
		if (a.available === undefined) return true;
		return a.available;
	});
};
export const getAllExcept = (actor: AssistantConfig): AssistantConfig[] => {
	return getAvailable().filter((a) => a.key !== actor.key);
};
export const actorsToKeys = (actors: AssistantConfig[]): string[] => {
	return actors.map((a) => a.key);
};
export const actorsToNames = (actors: AssistantConfig[]): string[] => {
	return actors.map((a) => a.name);
};
