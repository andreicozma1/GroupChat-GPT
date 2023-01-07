import {getAisAvailable, processKV} from "src/util/assistant/AssistantUtils";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";
import {parsePromptConfig} from "src/util/prompt/PromptConfig";

const getAssistantTraits = (
	ai: Assistant,
	useKey: boolean,
	tag?: string
): string => {
	const id = useKey ? ai.id : ai.name;
	let res = `# ${id}`;
	if (tag) res += ` (${tag})`;
	res += ":\n";
	if (ai.promptConfig.traits) {
		res += Object.entries(ai.promptConfig.traits)
			.map(([k, v]) =>
				processKV(k, v, {
					keyStartChar: "-",
				})
			)
			.join("\n");
	}
	return res;
};

export const promptMembers = (
	useKey: boolean,
	currentAI?: Assistant
): string => {
	const available = getAisAvailable();
	if (!available || available.length === 0) return "";

	const start = "=== CHAT MEMBERS ===";

	const info = available
		.map((ai) => {
			let tag = undefined;
			if (currentAI && currentAI.id === ai.id) tag = "You";
			return getAssistantTraits(ai, useKey, tag);
		})
		.join("\n\n");

	return start + "\n" + info;
};

export const promptRules = (ai: Assistant): string => {
	if (!ai.promptConfig.rules) return "";

	const start = "=== RULES ===";

	const rules = Object.entries(ai.promptConfig.rules)
		.map(([k, v]) =>
			processKV(k, v, {
				keyStartChar: "#",
			})
		)
		.join("\n");

	return start + "\n" + rules;
};

export const promptExamples = (ai: Assistant): string => {
	if (!ai.promptConfig.examples || ai.promptConfig.examples.length == 0) return "";
	// promptHeader = promptHeader || ConfigUserBase.name;
	// resultHeader = resultHeader || ai.name;
	const conf = parsePromptConfig(ai);
	const start = "=== EXAMPLES ===";

	const res = []
	for (let i = 0; i < ai.promptConfig.examples.length; i++) {
		let msg = ai.promptConfig.examples[i].trim();
		const isQuery = i % 2 === 0;
		if (isQuery && conf.exampleQueryWrapTag) msg = `<${conf.exampleQueryWrapTag}>\n${msg}\n</${conf.exampleQueryWrapTag}>`;
		if (!isQuery && conf.exampleResponseWrapTag) msg = `<${conf.exampleResponseWrapTag}>\n${msg}\n</${conf.exampleResponseWrapTag}>`;
		const identifier = isQuery ? conf.exampleQueryId : conf.exampleResponseId;
		if (conf.exampleUseHeader) msg = `### ${identifier}:\n${msg}`;
		res.push(msg)
	}

	return start + "\n" + res.join("\n\n");
};


export const promptConversation = (ai: Assistant, msgHist: ChatMessage[]): string => {
	const conf = parsePromptConfig(ai);
	const start = "=== CONVERSATION ===";

	const res = []
	for (let i = 0; i < msgHist.length; i++) {
		let msg = msgHist[i].textSnippets.map((s: string) => s.trim()).join("\n");
		const isQuery = i % 2 === 0;
		if (isQuery && conf.exampleQueryWrapTag) msg = `<${conf.exampleQueryWrapTag}>\n${msg}\n</${conf.exampleQueryWrapTag}>`;
		if (!isQuery && conf.exampleResponseWrapTag) msg = `<${conf.exampleResponseWrapTag}>\n${msg}\n</${conf.exampleResponseWrapTag}>`;
		const identifier = isQuery ? conf.exampleQueryId : conf.exampleResponseId;
		if (conf.exampleUseHeader) msg = `### ${identifier}:\n${msg}`;
		res.push(msg)
	}

	return start + "\n" + res.join("\n\n");
};
