import {Assistant} from "src/util/assistant/AssistantModels";
import {ConfigCoordinator} from "src/util/assistant/configs/ConfigCoordinator";
import {ConfigDavinci} from "src/util/assistant/configs/ConfigDavinci";
import {ConfigDalle, ConfigDalleGen} from "src/util/assistant/configs/ConfigDalle";
import {ConfigCodex, ConfigCodexGen} from "src/util/assistant/configs/ConfigCodex";

// TODO: Move this into a store
export const AssistantConfigs: Record<string, Assistant> = {
	/*******************************************************************************************************************
	 * Response Coordinator
	 * - Decides which assistant should respond to the user's message
	 ******************************************************************************************************************/
	coordinator: ConfigCoordinator,
	/*******************************************************************************************************************
	 * General AI Assistants
	 ******************************************************************************************************************/
	davinci: ConfigDavinci,
	// DALL-E
	dalle: ConfigDalle,
	dalle_gen: ConfigDalleGen,
	// Codex
	codex: ConfigCodex,
	codex_gen: ConfigCodexGen,
};