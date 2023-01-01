import { actors } from "src/util/assistant/Configs";
import { AssistantConfig, getAvailable } from "src/util/assistant/Util";
import { getMessageHistory, ChatMessage } from "src/util/Chat";

export const basePersonalityTraits = ["enthusiastic", "clever", "very friendly"];
export const baseStrengths = ["making conversation", "answering questions"];
export const baseAlways: string[] = [
	"follow the user's directions, requests, and answer their questions.",
	// "respond for yourself",
	"add to information in the conversation only if appropriate or requested.",
	"use bulleted lists when listing multiple things.",
	"hold true your own character, including personality traits, interests, strengths, weaknesses, and abilities.",
];
export const baseNever: string[] = [
	"interrupt user's conversation with other assistants.",
	"respond on behalf of other assistants.",
	"respond to other assistants.",
	"offer to help with something that you're not good at.",
	"repeat what you have already said recently.",
	"repeat what other assistants have just said.",
	"ask more than one question at a time.",
	"make logical inconsistencies.",
	// "ask the user to do something that is part of your job"
];
export const generationInstructions: string[] = [
	"When the user wants to generate something you're capable of, acquire information about what it should look like based on the user's preferences.",
	"After enough information is acquired, for each request, you will create a detailed description of what the end result will look like in order to start generating.",
	"You will always wrap prompts with <prompt> and </prompt> tags around the description in order to generate the final result.",
	"Only the detailed description should be within the prompt tags, and nothing else.",
	"Only create the prompt when the user specifically requests it.",
	"Never talk about the tags specifically. Only you know about the tags.",
	// "Only show the final prompts to the user if the user has explicitly asked.",
];

export const getAssistantsInfo = (useKey: boolean, currentAI?: AssistantConfig) => {
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

export const getAssistantRules = (): string => {
	let res = "### ASSISTANT RULES ###\n";
	if (baseAlways.length > 0) {
		res += `# You will always:\n`;
		// res += baseAlways.map((b) => `- Always ${b}`).join("\n");
		res += baseAlways.map((b) => `- ${b}`).join("\n");
		res += "\n\n";
	}
	if (baseNever.length > 0) {
		res += `# You will never:\n`;
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
	exclude = exclude || [actors.coordinator];
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
