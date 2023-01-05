import {promptConversation, promptExamples, promptMembers, promptRules,} from "src/util/prompt/PromptUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";

export const createAssistantPrompt = (
	ai: Assistant,
	msgHist: ChatMessage[]
): any => {
	let start = "### AI GROUP CHAT ###\n";
	start += "The following is a group-chat conversation between a human and several AI assistants.\n";

	const members = promptMembers(false, ai);
	const rules = promptRules(ai);
	const examples = promptExamples(ai);
	const conv = promptConversation(msgHist);
	const end = `### ${ai.name}:\n`;

	return finalizePrompt([start, members, rules, examples, conv, end])
};

export const createPromptDalleGen = (
	ai: Assistant,
	msgHist: ChatMessage[]
) => {
	const usedMessage: ChatMessage = msgHist[msgHist.length - 1];
	// last text
	let prompt: string = usedMessage.textSnippets[usedMessage.textSnippets.length - 1];
	prompt = prompt.replace(/(<([^>]+)>)/gi, "");
	return prompt
};

export const createPromptCodexGen = (
	ai: Assistant,
	msgHist: ChatMessage[]
) => {
	const start = "### CODE GENERATION ###\n";

	const rules = promptRules(ai);
	const examples = promptExamples(ai);

	const usedMessage: ChatMessage = msgHist[msgHist.length - 1];
	// last text
	let prompt = "### PROMPT:\n";
	prompt += usedMessage.textSnippets[usedMessage.textSnippets.length - 1].replace(
		/(<([^>]+)>)/gi,
		""
	);

	const end = `### CODE:\n`;

	return finalizePrompt([start, rules, examples, prompt, end])
};

const finalizePrompt = (all: string[]): string => {
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};
