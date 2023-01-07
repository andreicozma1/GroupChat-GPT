import {PromptConfig} from "src/util/prompt/PromptModels";
import {ChatUser} from "src/util/chat/ChatModels";

export interface Assistant extends ChatUser {
	apiReqConfig: string;
	/*******************************************************************************************************************
	 ### Prompt Configuration
	 - TODO: Move these into a separate interface (promptConfig)
	 ******************************************************************************************************************/
	promptConfig: PromptConfig;
	followupPromptHelperId?: string;

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
	commaSepMinChars?: number;
}
