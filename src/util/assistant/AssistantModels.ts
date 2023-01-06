import {PromptRules, PromptTraits} from "src/util/prompt/PromptModels";
import {ChatUser} from "src/util/chat/ChatModels";

export interface PromptExamplesConfig {
	queryIdentifier?: string;
	responseIdentifier?: string;
	useWrapper?: boolean;
	useHeader?: boolean;
}

export interface Assistant extends ChatUser {
	apiConfig: {
		apiReqType: string;
		apiReqOpts?: string;
	};
	/*******************************************************************************************************************
	 ### Prompt Configuration
	 - TODO: Move these into a separate interface (promptConfig)
	 ******************************************************************************************************************/
	promptConfig: {
		promptStyle: any;
		promptExamplesConfig?: PromptExamplesConfig;
	}
	followupPromptHelperId?: string;
	traits?: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; // Order: Human, AI, Human, AI, etc.
	/*******************************************************************************************************************
	 ### Flags
	 - TODO: Move these into a separate interface (flags)
	 ******************************************************************************************************************/
	allowPromptFollowUps?: boolean;
	isAvailable?: boolean; // Whether to show this AI in the list of available AIs
	defaultHidden?: boolean;
	shouldIgnoreCache?: boolean;
	/*******************************************************************************************************************
	 ### Other Props
	 ******************************************************************************************************************/
	extras?: {
		[key: string]: any;
	};
}

// TODO: Find better name for these and move them to a separate file
export interface ProcessKVConfig {
	keyStartChar?: string;
	valJoinStr?: string;
	inline?: boolean;
}
