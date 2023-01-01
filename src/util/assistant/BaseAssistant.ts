import { getChatMembersInfo, getConversation, getExamples, getRules } from "src/util/assistant/Prompt";
import { AssistantConfig } from "src/util/assistant/Util";
import { ChatMessage } from "src/util/Chat";

export const createAssistantPrompt = (ai: AssistantConfig, messages: ChatMessage[]): string => {
	let start = "### AI GROUP CHAT ###\n";
	start += "The following is a group-chat conversation between a human and several AI assistants.\n";

	const info = getChatMembersInfo(false, ai);
	const rules = getRules(ai);
	const examples = getExamples(ai);
	const conv = getConversation(messages);
	const end = `### ${ai.name}:\n`;

	let all = [start, info, rules, examples, conv, end];
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};
