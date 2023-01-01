import { AssistantConfigs } from "src/util/assistant/Configs";
import { getAssistantRules, getAssistantsInfo, getConversation, getExamples } from "src/util/assistant/Prompt";
import { AssistantConfig } from "src/util/assistant/Util";
import { ChatMessage } from "src/util/Chat";

const coordinatorPromptStart = "### AI GROUP CHAT ###\n" + +"\n";

export const createPromptCoordinator = (actor: AssistantConfig, messages: ChatMessage[]) => {
	const start = coordinatorPromptStart;
	const rules = getAssistantRules();
	const info = getAssistantsInfo(true);
	const examples = getExamples(actor);
	const conv = getConversation(messages, [], [AssistantConfigs.coordinator], 5);
	const end = `### ${actor.name}:\n`;
	return (start + info + rules + examples + conv + end).trim();
};
