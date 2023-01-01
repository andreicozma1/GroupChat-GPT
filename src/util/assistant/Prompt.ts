import { AssistantConfigs } from "src/util/assistant/Configs";
import { AssistantConfig, getAvailable } from "src/util/assistant/Util";
import { ChatMessage, getMessageHistory } from "src/util/Chat";

export const getAssistantsInfo = (useKey: boolean, currentAI?: AssistantConfig) => {
	const available = getAvailable();
	let res = "### ASSISTANTS ###\n";
	res += available
		.map((ai) => {
			const id = useKey ? ai.key : ai.name;
			let res = `# ${id}`;
			if (currentAI && currentAI.key === ai.key) res += " (You)";
			res += ":\n";
			if (ai.traits) {
				// if (ai.personality) res += `- Personality Traits: ${ai.personality.join(", ")}.\n`;
				// if (ai.strengths) res += `- Strengths: ${ai.strengths.join(", ")}.\n`;
				// if (ai.weaknesses) res += `- Weaknesses: ${ai.weaknesses.join(", ")}.\n`;
				// if (ai.abilities) res += `- Abilities: ${ai.abilities.join(", ")}.\n`;
				res += Object.entries(ai.traits)
					.map(([k, v]) => `- ${k}: ${v.join(", ")}`)
					.join("\n");
			}
			res += "\n";
			return res;
		})
		.join("\n");
	res += "\n";
	return res;
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
