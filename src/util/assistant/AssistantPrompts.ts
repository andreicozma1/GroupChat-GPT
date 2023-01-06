import {promptConversation, promptExamples, promptMembers, promptRules,} from "src/util/prompt/PromptUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";

export const createAssistantPrompt = (
	ai: Assistant,
	msgHist: ChatMessage[]
): any => {
	let start = "### AI GROUP CHAT ###\n";
	start +=
		"The following is a group-chat conversation between a human and several AI assistants.\n";

	const members = promptMembers(false, ai);
	const rules = promptRules(ai);
	const examples = promptExamples(ai);
	const conv = promptConversation(msgHist);
	const end = `### ${ai.name}:\n`;

	return finalizePrompt([start, members, rules, examples, conv, end]);
};

export const createPromptDalleGen = (ai: Assistant, msgHist: ChatMessage[]) => {
	// find the last message that contains a html tag in any of the text snippets

	const usedMessages: ChatMessage[] = msgHist.filter((msg) => {
		// based on regex
		return msg.textSnippets.some((text: string) => {
			return /(<([^>]+)>)/gi.test(text);
		});
	});
	if (usedMessages.length === 0) {
		smartNotify("Error: No messages with prompts found in message history");
		return undefined;
	}
	// now get the actual textSnippet that contains the html tag
	const promptSnippets = usedMessages[usedMessages.length - 1].textSnippets.filter((text: string) => {
		return /(<([^>]+)>)/gi.test(text);
	})

	if (promptSnippets.length === 0) {
		smartNotify("Error: No prompt found in the conversation history");
		return undefined;
	}

	let prompt = promptSnippets[promptSnippets.length - 1];
	prompt = prompt.replace(/(<([^>]+)>)/gi, "");

	return prompt;
};

export const createPromptCodexGen = (ai: Assistant, msgHist: ChatMessage[]) => {
	const start = "### CODE GENERATION ###\n";

	const rules = promptRules(ai);

	const promptHeader = "PROMPT"
	const resultHeader = "RESULT"

	const examples = promptExamples(ai, promptHeader, resultHeader);

	// const usedMessage: ChatMessage = msgHist[msgHist.length - 1];
	// // last text
	// let prompt = `### ${promptHeader}:\n`;
	// prompt += usedMessage.textSnippets[
	// usedMessage.textSnippets.length - 1
	// 	].replace(/(<([^>]+)>)/gi, "");

	const usedMessages: ChatMessage[] = msgHist.filter((msg) => {
		// based on regex
		return msg.textSnippets.some((text: string) => {
			return /(<([^>]+)>)/gi.test(text);
		});
	});
	if (usedMessages.length === 0) {
		smartNotify("Error: No messages with prompts found in message history");
		return undefined;
	}
	// now get the actual textSnippet that contains the html tag
	const promptSnippets = usedMessages[usedMessages.length - 1].textSnippets.filter((text: string) => {
		return /(<([^>]+)>)/gi.test(text);
	})

	if (promptSnippets.length === 0) {
		smartNotify("Error: No prompt found in the conversation history");
		return undefined;
	}
	let prompt = promptSnippets[promptSnippets.length - 1];
	prompt = prompt.replace(/(<([^>]+)>)/gi, "");

	const end = `### ${resultHeader}:\n`;

	return finalizePrompt([start, rules, examples, prompt, end]);
};

const finalizePrompt = (all: string[]): string => {
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};
