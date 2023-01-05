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
