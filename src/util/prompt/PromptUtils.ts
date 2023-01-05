import {getAisAvailable, processKV,} from "src/util/assistant/AssistantUtils";
import {humanName} from "stores/compStore";
import {Assistant} from "src/util/assistant/AssistantModels";
import {ChatMessage} from "src/util/chat/ChatModels";

const getAssistantTraits = (
	ai: Assistant,
	useKey: boolean,
	tag?: string
): string => {
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

export const promptMembers = (
	useKey: boolean,
	currentAI?: Assistant
): string => {
	const available = getAisAvailable();
	if (!available || available.length === 0) return "";

	const start = "### CHAT MEMBERS ###";

	const info = available
		.map((ai) => {
			let tag = undefined;
			if (currentAI && currentAI.key === ai.key) tag = "You";
			return getAssistantTraits(ai, useKey, tag);
		})
		.join("\n\n");

	return start + "\n" + info;
};

export const promptExamples = (ai: Assistant): string => {
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

export const promptRules = (ai: Assistant): string => {
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

export const promptConversation = (msgHist: ChatMessage[]): string => {
	const start = "### CONVERSATION ###";

	const conv = msgHist
		.map((m) => {
			const v = m.textSnippets.map((s: string) => s.trim());
			const r = [`### ${m.userName}:`, ...v];
			return r.join("\n");
		})
		.join("\n\n");

	return start + "\n" + conv;
};
