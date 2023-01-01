import { getAssistantRules, getAssistantsInfo, getConversation } from "src/util/assistant/Prompt";
import { AssistantConfig } from "src/util/assistant/Util";
import { ChatMessage } from "src/util/Chat";

const assistantPromptStart =
	"The following is a group-chat conversation between a human and several AI assistants.\n" + "\n";

export const createAssistantPrompt = (actor: AssistantConfig, messages: ChatMessage[]): string => {
	const start = assistantPromptStart;
	const rules = getAssistantRules();
	const info = getAssistantsInfo(false, actor);
	let instr = "";
	if (actor.rules) {
		instr += `### Additional instructions for ${actor.name} (only you know this):\n`;
		instr += actor.rules.map((b) => `- ${b}`).join("\n");
		instr += "\n\n";
	}
	const conv = getConversation(messages);
	const end = `### ${actor.name}:\n`;
	return (start + rules + info + instr + conv + end).trim();
};
