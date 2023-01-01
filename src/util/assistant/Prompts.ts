import { promptConversation, promptExamples, promptMembers, promptRules } from "src/util/assistant/PromptUtil";
import { AssistantConfig } from "src/util/assistant/Util";
import { ChatMessage } from "src/util/Chat";

export const createAssistantPrompt = (ai: AssistantConfig, messages: ChatMessage[]): string => {
	let start = "### AI GROUP CHAT ###\n";
	start += "The following is a group-chat conversation between a human and several AI assistants.\n";

	const info = promptMembers(false, ai);
	const rules = promptRules(ai);
	const examples = promptExamples(ai);
	const conv = promptConversation(messages);
	const end = `### ${ai.name}:\n`;

	let all = [start, info, rules, examples, conv, end];
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};

export const createPromptDalleGen = (actor: AssistantConfig, messages: ChatMessage[]) => {
	const lastMessage = messages[messages.length - 1];
	return lastMessage.text[lastMessage.text.length - 1];
};
