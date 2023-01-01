import { CreateCompletionRequest, CreateImageRequest } from "openai/api";
import { assistants } from "src/util/assistant/Configs";

export interface AssistantConfig {
	key: string;
	name: string;
	createPrompt: any;
	apiConfig: CreateCompletionRequest | CreateImageRequest;
	createComp?: any;
	icon: string;
	ignoreCache?: boolean;
	available?: boolean;
	personality?: string[];
	strengths?: string[];
	weaknesses?: string[];
	abilities?: string[];
	instructions?: string[];
	createGen?: string;
	vals?: any;
}

export const getAvailable = (): AssistantConfig[] => {
	return Object.values(assistants).filter((a) => {
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
