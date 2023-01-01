import { AssistantConfigs } from "src/util/assistant/Configs";
import { AssistantConfig, getAvailable } from "src/util/assistant/Util";
import { ChatMessage, getMessageHistory } from "src/util/Chat";

function getAssistantInfo(ai: AssistantConfig, useKey: boolean, tag?: string): string {
	const id = useKey ? ai.key : ai.name;
	let res = `# ${id}`;
	if (tag) res += ` (${tag})`;
	res += ":\n";
	if (ai.traits) {
		res += Object.entries(ai.traits)
			.map(([k, v]) => `- ${k}: ${v.join(", ")}`)
			.join("\n");
	}
	res += "\n";
	return res;
}

export const getAssistantsInfo = (useKey: boolean, currentAI?: AssistantConfig) => {
	const start = "### ASSISTANTS ###";
	const available = getAvailable();
	let info = undefined;
	if (available && available.length === 0) {
		info = available
			.map((ai) => {
				let tag = undefined;
				if (currentAI && currentAI.key === ai.key) tag = " (You)";
				return getAssistantInfo(ai, useKey, tag);
			})
			.join("\n");
	}
	if (!info) info = "- No assistants available.";
	return start + "\n" + info + "\n";
};

export const getExamples = (ai: AssistantConfig) => {
	const start = "### EXAMPLES ###";
	let examples = undefined;
	if (ai.examples && ai.examples.length > 0) {
		examples = ai.examples.map((e) => {
			// Order: Human, AI, Human, AI, etc.
			let res = "";
			for (let i = 0; i < e.length; i++) {
				const msg = e[i];
				const isHuman = i % 2 === 0;
				const name = isHuman ? "You" : ai.name;
				res += `### ${name}:\n${msg}\n\n`;
			}
			return res;
		});
	}
	if (!examples) examples = "- No examples available.";
	return start + "\n" + examples + "\n";
};

export const getAssistantRules = (): string => {
	let res = "### RULES ###\n";
	if (baseAlways.length > 0) {
		res += `# Assistants always:\n`;
		// res += baseAlways.map((b) => `- Always ${b}`).join("\n");
		res += baseAlways.map((b) => `- ${b}`).join("\n");
		res += "\n\n";
	}
	if (baseNever.length > 0) {
		res += `# Assistants never:\n`;
		// res += baseNever.map((b) => `- Never ${b}`).join("\n");
		res += baseNever.map((b) => `- ${b}`).join("\n");
		res += "\n\n";
	}
	return res;
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
	}).map((message) => {
		return `### ${message.name}:\n${message.text.join("\n")}\n`;
	});
	return start + "\n" + hist.join("\n") + "\n";
};

export const createPromptDalleGen = (actor: AssistantConfig, messages: ChatMessage[]) => {
	const lastMessage = messages[messages.length - 1];
	return lastMessage.text[lastMessage.text.length - 1];
};
