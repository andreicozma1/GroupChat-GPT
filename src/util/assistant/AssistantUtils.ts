import {AssistantConfigs} from "src/util/assistant/Assistants";

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
		apiReqType: string;
		apiReqOpts?: string;
	};
	traits?: AssistantTraits;
	rules?: AssistantRules;
	// Order: Human, AI, Human, AI, etc.
	examples?: string[];
	extras?: {
		[key: string]: any;
	};
	followUps?: boolean;
	available?: boolean;
	helper?: boolean;
	ignoreCache?: boolean;
}

export const getAllAvailable = (): AssistantConfig[] => {
	return Object.values(AssistantConfigs).filter((a) => {
		if (a.available === undefined) return true;
		return a.available;
	});
};

export const getAllAvailableExcept = (actor: AssistantConfig): AssistantConfig[] => {
	return getAllAvailable().filter((a) => a.key !== actor.key);
};

export const actorsToKeys = (actors: AssistantConfig[]): string[] => {
	return actors.map((a) => a.key);
};

export const actorsToNames = (actors: AssistantConfig[]): string[] => {
	return actors.map((a) => a.name);
};

interface ProcessKVConfig {
	keyStartChar?: string;
	valJoinStr?: string;
	inline?: boolean;
}

// TODO: Find better name for this
export const processKV = (key: string, val: string | string[], config?: ProcessKVConfig): string => {
	const keyStartChar: string = config?.keyStartChar || "#";
	let valJoinStr: string = config?.valJoinStr || ", ";
	let inline: boolean = config?.inline || true;

	key = key.replace(/_/g, " ");
	key = key.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	);
	val = Array.isArray(val) ? val : [val];
	val = val.map((s: string) => s.trim());
	if (val.every((s: string) => s.length > 50)) {
		valJoinStr = "\n";
		inline = false;
		val = val.map((s: string) => `- ${s}`);
	}
	val = val.join(valJoinStr);

	return [`${keyStartChar} ${key}:`, val].join(inline ? " " : "\n");
};
