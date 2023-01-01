import { actors, baseAlways, baseNever } from "src/util/ActorsConfig";
import { ActorConfig, MsgHistoryConfig, TextMessage } from "src/util/Models";
import { getAvailable, humanName } from "stores/compStore";

export const getPromptAssistantsInfo = (useKey: boolean, currentAI?: ActorConfig) => {
	const available = getAvailable();
	let res = "### ASSISTANTS ###\n";
	res += available
		.map((ai) => {
			const id = useKey ? ai.key : ai.name;
			let res = `# ${id}`;
			if (currentAI && currentAI.key === ai.key) res += " (You)";
			res += ":\n";
			if (ai.personality) res += `- Personality Traits: ${ai.personality.join(", ")}.\n`;
			if (ai.strengths) res += `- Strengths: ${ai.strengths.join(", ")}.\n`;
			if (ai.weaknesses) res += `- Weaknesses: ${ai.weaknesses.join(", ")}.\n`;
			if (ai.abilities) res += `- Abilities: ${ai.abilities.join(", ")}.\n`;
			return res;
		})
		.join("\n");
	res += "\n";
	return res;
};

export const getPromptAssistantRules = (): string => {
	let res = "### ASSISTANT RULES ###\n";
	if (baseAlways.length > 0) {
		res += `# Assistants always:\n`;
		res += baseAlways.map((b) => `- Always ${b}`).join("\n");
		res += "\n\n";
	}
	if (baseNever.length > 0) {
		res += `# Assistants never:\n`;
		res += baseNever.map((b) => `- Never ${b}`).join("\n");
		res += "\n\n";
	}
	return res;
};
export const getPromptChatHistory = (
	messages: TextMessage[],
	include?: ActorConfig[],
	exclude?: ActorConfig[],
	length?: number
): string => {
	include = include || undefined;
	exclude = exclude || [actors.coordinator];
	length = length || 10;
	const start = "### CONVERSATION ###";
	const hist = getChatMessageHistory({
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

export const getChatMessageHistory = (config: MsgHistoryConfig): TextMessage[] => {
	let hist = config.messages;
	hist = hist.filter((m) => {
		if (m.name === humanName) {
			if (config.includeSelf === undefined) return true;
			return config.includeSelf;
		}
		// handle actors to include and exclude
		if (config.includeActors) {
			return config.includeActors.some((actor) => actor.name === m.name);
		}
		if (config.excludeActors) {
			return !config.excludeActors.some((actor) => actor.name === m.name);
		}
		return true;
	});
	hist = hist.filter((m) => m.text.length > 0);
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength);
	return hist;
};

export const createPromptDalleGen = (actor: ActorConfig, messages: TextMessage[]) => {
	const lastMessage = messages[messages.length - 1];
	return lastMessage.text[lastMessage.text.length - 1];
};
