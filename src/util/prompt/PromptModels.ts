export interface PromptConfig {
	promptType: string;
	traits: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; // Order: Human, AI, Human, AI, etc.
	exampleQueryId?: string;
	exampleResponseId?: string;
	exampleQueryWrapTag?: string;
	exampleResponseWrapTag?: string;
	exampleUseHeader?: boolean;
}

export interface PromptTraits {
	personality?: string | string[];
	strengths?: string | string[];
	weaknesses?: string | string[];
	abilities?: string | string[];
}

export interface PromptRules {
	always?: string | string[];
	never?: string | string[];
}