import { AssistantConfig } from "src/util/assistant/AssistantUtils";
import { ChatMessage } from "src/util/Chat";
import { promptConversation, promptExamples, promptMembers, promptRules } from "src/util/prompt/PromptUtils";

export const createAssistantPrompt = (ai: AssistantConfig, messages: ChatMessage[]): string => {
	let start = "### AI GROUP CHAT ###\n";
	start += "The following is a group-chat conversation between a human and several AI assistants.\n";

	const members = promptMembers(false, ai);
	const rules = promptRules(ai);
	const examples = promptExamples(ai);
	const conv = promptConversation(messages);
	const end = `### ${ai.name}:\n`;

	return finalizePrompt([start, members, rules, examples, conv, end]);
};

export const createPromptDalleGen = (ai: AssistantConfig, messages: ChatMessage[]) => {
	const lastMessage: ChatMessage = messages[messages.length - 1];
	// last text
	let prompt: string = lastMessage.text[lastMessage.text.length - 1];
	prompt = prompt.replace(/(<([^>]+)>)/gi, "");
	return prompt;
};

export const createPromptCodexGen = (ai: AssistantConfig, messages: ChatMessage[]) => {
	const start = "### CODE GENERATION ###\n";

	const rules = promptRules(ai);
	const examples = promptExamples(ai);

	const lastMessage: ChatMessage = messages[messages.length - 1];
	// last text
	let prompt = "### PROMPT:\n";
	prompt += lastMessage.text[lastMessage.text.length - 1].replace(/(<([^>]+)>)/gi, "");

	const end = `### CODE:\n`;

	return finalizePrompt([start, rules, examples, prompt, end]);
};

const finalizePrompt = (all: string[]): string => {
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};
