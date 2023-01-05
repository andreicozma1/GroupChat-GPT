import {Assistant} from "src/util/assistant/AssistantModels";
import {CoordinatorConfig} from "src/util/assistant/configs/Coordinator";
import {DavinciConfig} from "src/util/assistant/configs/Davinci";
import {DalleConfig, DalleGenConfig} from "src/util/assistant/configs/Dalle";
import {CodexConfig, CodexGenConfig} from "src/util/assistant/configs/Codex";

// TODO: Move this into a store
export const AssistantConfigs: Record<string, Assistant> = {
	/*******************************************************************************************************************
	 * Response Coordinator
	 * - Decides which assistant should respond to the user's message
	 ******************************************************************************************************************/
	coordinator: CoordinatorConfig,
	/*******************************************************************************************************************
	 * General AI Assistants
	 ******************************************************************************************************************/
	davinci: DavinciConfig,
	// DALL-E
	dalle: DalleConfig,
	dalle_gen: DalleGenConfig,
	// Codex
	codex: CodexConfig,
	codex_gen: CodexGenConfig,
};
