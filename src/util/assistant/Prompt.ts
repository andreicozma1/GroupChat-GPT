import { AssistantConfigs } from "src/util/assistant/Configs";
import { AssistantConfig, getAvailable } from "src/util/assistant/Util";
import { ChatMessage, getMessageHistory } from "src/util/Chat";

export const getChatMembersInfo = (useKey: boolean, currentAI?: AssistantConfig): string => {
	const available = getAvailable();
	if (!available || available.length === 0) return "";

	const start = "### CHAT MEMBERS ###";

	const info = available
		.map((ai) => {
			let tag = undefined;
			if (currentAI && currentAI.key === ai.key) tag = " (You)";
			return getAssistantTraits(ai, useKey, tag);
		})
		.join("\n");

	return start + "\n" + info;
};

export const getExamples = (ai: AssistantConfig): string => {
	if (!ai.examples || ai.examples.length == 0) return "";

	const start = "### EXAMPLES ###";

	let res = "";
	for (let i = 0; i < ai.examples.length; i++) {
		const msg = ai.examples[i];
		const isHuman = i % 2 === 0;
		const name = isHuman ? "You" : ai.name;
		res += `### ${name}:\n${msg}\n\n`;
	}

	return start + "\n" + res;
};

function getAssistantTraits(ai: AssistantConfig, useKey: boolean, tag?: string): string {
	const id = useKey ? ai.key : ai.name;
	let res = `* ${id}`;
	if (tag) res += ` (${tag})`;
	res += ":\n";
	if (ai.traits) {
		res += Object.entries(ai.traits)
			.map(([k, v]) => {
				k = k.toUpperCase();
				v = Array.isArray(v) ? v.join(", ") : v;
				return `- ${k}: ${v}`;
			})
			.join("\n");
	}
	return res;
}

export const getRules = (ai: AssistantConfig): string => {
	if (!ai.rules) return "";

	const start = "### RULES ###";

	const rules = Object.entries(ai.rules)
		.map(([k, v]) => {
			k = k.toUpperCase();
			v = Array.isArray(v) ? v.join(", ") : v;
			return `- ${k}: ${v}`;
		})
		.join("\n");

	return start + "\n" + rules;
};

export const getConversation = (
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
			return `### ${message.name}:\n${message.text.join("\n")}\n`;
		})
		.join("\n");

	return start + "\n" + conv;
};

export const createPromptDalleGen = (actor: AssistantConfig, messages: ChatMessage[]) => {
	const lastMessage = messages[messages.length - 1];
	return lastMessage.text[lastMessage.text.length - 1];
};
