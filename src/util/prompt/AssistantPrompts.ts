import {promptConversation, promptExamples, promptMembersInfo, promptRules,} from "src/util/prompt/PromptUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";
import {smartNotify} from "src/util/SmartNotify";
import {parsePromptConfig} from "src/util/prompt/PromptConfig";

export const createAssistantPrompt = (
	ai: Assistant,
	msgHist: ChatMessage[]
): any => {
	const start = "=== AI GROUP CHAT ===";
	const desc = "The following is a group-chat conversation between a human and several AI assistants.";

	const members = promptMembersInfo(false, ai);
	const rules = promptRules(ai);
	const examples = promptExamples(ai);
	const conv = promptConversation(ai, msgHist);

	return finalizePrompt(ai, [start, desc, members, rules, examples, conv]);
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

	const examples = promptExamples(ai);

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

	return finalizePrompt(ai, [start, rules, examples, prompt]);
};

const finalizePrompt = (ai: Assistant, all: string[]): string => {
	const exConf = parsePromptConfig(ai);
	if (exConf.exampleUseHeader) {
		const end = `### ${exConf.exampleResponseId}:`;
		all.push(end);
	}
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};

export const AssistantPromptTypes: { [key: string]: any } = {
	"createAssistantPrompt": createAssistantPrompt,
	"createPromptDalleGen": createPromptDalleGen,
	"createPromptCodexGen": createPromptCodexGen,
}
