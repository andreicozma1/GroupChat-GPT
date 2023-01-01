import { AssistantConfigs } from "src/util/assistant/Assistants";
import { AssistantConfig, getAvailable, processKV } from "src/util/assistant/AssistantUtils";
import { ChatMessage, getMessageHistory } from "src/util/Chat";
import { humanName } from "stores/compStore";

const getAssistantTraits = (ai: AssistantConfig, useKey: boolean, tag?: string): string => {
	const id = useKey ? ai.key : ai.name;
	let res = `* ${id}`;
	if (tag) res += ` (${tag})`;
	res += ":\n";
	if (ai.traits) {
		res += Object.entries(ai.traits)
			.map(([k, v]) =>
				processKV(k, v, {
					keyStartChar: "-",
				})
			)
			.join("\n");
	}
	return res;
};

export const promptMembers = (useKey: boolean, currentAI?: AssistantConfig): string => {
	const available = getAvailable();
	if (!available || available.length === 0) return "";

	const start = "### CHAT MEMBERS ###";

	const info = available
		.map((ai) => {
			let tag = undefined;
			if (currentAI && currentAI.key === ai.key) tag = "You";
			return getAssistantTraits(ai, useKey, tag);
		})
		.join("\n");

	return start + "\n" + info;
};

export const promptExamples = (ai: AssistantConfig): string => {
	if (!ai.examples || ai.examples.length == 0) return "";

	const start = "### EXAMPLES ###";

	let res = "";
	for (let i = 0; i < ai.examples.length; i++) {
		const msg = ai.examples[i];
		const isHuman = i % 2 === 0;
		const name = isHuman ? humanName : ai.name;
		res += `### ${name}:\n${msg}\n\n`;
	}

	return start + "\n" + res;
};

export const promptRules = (ai: AssistantConfig): string => {
	if (!ai.rules) return "";

	const start = "### RULES ###";

	const rules = Object.entries(ai.rules)
		.map(([k, v]) =>
			processKV(k, v, {
				keyStartChar: "*",
			})
		)
		.join("\n");

	return start + "\n" + rules;
};

export const promptConversation = (
	messages: ChatMessage[],
	include?: AssistantConfig[],
	exclude?: AssistantConfig[],
	length?: number
): string => {
	include = include || undefined;
	exclude = exclude || [AssistantConfigs.coordinator];
	length = length || 10;

	const start = "### CONVERSATION ###";

	const hist = getMessageHistory({
		messages,
		includeSelf: true,
		includeActors: include,
		excludeActors: exclude,
		maxLength: length,
	});

	const conv = hist
		.map((message) => {
			const v = message.text.map((s) => s.trim());
			const r = [`### ${message.name}:`, ...v];
			return r.join("\n");
		})
		.join("\n\n");

	return start + "\n" + conv;
};
