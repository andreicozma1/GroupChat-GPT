import {getAvailableAssistants, processKV} from "src/util/assistant/AssistantUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";
import {parsePromptConfig} from "src/util/prompt/PromptConfig";
import {PromptConfig} from "src/util/prompt/PromptModels";

const promptAssistantInfo = (
	ai: Assistant,
	parenthesesTag?: string
): string => {
	parenthesesTag = parenthesesTag === undefined ? "" : ` (${parenthesesTag})`;
	const header = `# ${ai.name}${parenthesesTag}`;

	if (!ai.promptConfig.traits) return header;

	const info: string = Object.entries(ai.promptConfig.traits)
		.map(([k, v]) => {
			return processKV(k, v, {keyStartChar: "-"})
		})
		.join("\n");

	return [header, info].join("\n");
};

export const promptMembersInfo = (
	useKey: boolean,
	currentAssistant?: Assistant
): string => {
	const availableAssistants: Assistant[] = getAvailableAssistants();
	if (!availableAssistants || availableAssistants.length === 0) return "";

	const header = "=== CHAT MEMBERS ===";

	const info: string = availableAssistants
		.map((assistant: Assistant) => {
			let tag = undefined;
			if (currentAssistant && currentAssistant.id === assistant.id) tag = "You";
			return promptAssistantInfo(assistant, tag);
		})
		.join("\n\n");

	return [header, info].join("\n");
};

export const promptRules = (ai: Assistant): string => {
	if (!ai.promptConfig.rules) return "";

	const header = "=== RULES ===";

	const rules: string = Object.entries(ai.promptConfig.rules)
		.map(([k, v]) => {
			return processKV(k, v, {keyStartChar: "#",})
		})
		.join("\n");

	return [header, rules].join("\n");
};

export const promptExamples = (ai: Assistant): string => {
	if (!ai.promptConfig.examples || ai.promptConfig.examples.length == 0) return "";
	// promptHeader = promptHeader || ConfigUserBase.name;
	// resultHeader = resultHeader || ai.name;
	const config: PromptConfig = parsePromptConfig(ai);
	const header = "=== EXAMPLES ===";

	const examples: string = ai.promptConfig.examples.map((example: string, i) => {
		let msgPrompt = example.trim();
		const isQuery: boolean = i % 2 === 0;
		if (isQuery && config.exampleQueryWrapTag) msgPrompt = `<${config.exampleQueryWrapTag}>\n${msgPrompt}\n</${config.exampleQueryWrapTag}>`;
		if (!isQuery && config.exampleResponseWrapTag) msgPrompt = `<${config.exampleResponseWrapTag}>\n${msgPrompt}\n</${config.exampleResponseWrapTag}>`;
		const identifier = isQuery ? config.exampleQueryId : config.exampleResponseId;
		if (config.exampleUseHeader) msgPrompt = `### ${identifier}:\n${msgPrompt}`;
		return msgPrompt;
	}).join("\n\n");

	return [header, examples].join("\n");
};


export const promptConversation = (assistant: Assistant, messages: ChatMessage[]): string => {
	const config: PromptConfig = parsePromptConfig(assistant);
	const header = "=== CONVERSATION ===";

	const res: string = messages.map((msg: ChatMessage, i) => {
		let msgPrompt = msg.textSnippets.map((s: string) => s.trim()).join("\n");
		const isQuery = i % 2 === 0;
		if (isQuery && config.exampleQueryWrapTag) msgPrompt = `<${config.exampleQueryWrapTag}>\n${msgPrompt}\n</${config.exampleQueryWrapTag}>`;
		if (!isQuery && config.exampleResponseWrapTag) msgPrompt = `<${config.exampleResponseWrapTag}>\n${msgPrompt}\n</${config.exampleResponseWrapTag}>`;
		const identifier = isQuery ? config.exampleQueryId : config.exampleResponseId;
		if (config.exampleUseHeader) msgPrompt = `### ${identifier}:\n${msgPrompt}`;
		return msgPrompt;
	}).join("\n\n");

	return [header, res].join("\n");
};
