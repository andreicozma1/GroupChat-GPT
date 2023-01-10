export interface PromptConfig {
	promptType: string;
	traits?: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; // Order: Human, AI, Human, AI, etc.
	exampleQueryHeader?: string;
	responseHeader: string;
	queryWrapTag?: string;
	responseWrapTag?: string;
}

export interface PromptTraits {
	personality?: string[];
	strengths?: string[];
	weaknesses?: string[];
	abilities?: string[];
}

export interface PromptRules {
	always?: string[];
	never?: string[];
}