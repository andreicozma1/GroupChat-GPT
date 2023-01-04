import {getAisAvailable, processKV,} from "src/util/assistant/AiAssistantUtils";
import {ChatMessage} from "src/util/ChatUtils";
import {humanName} from "stores/compStore";
import {AiAssistant} from "src/util/assistant/AiAssistantModels";

const getAssistantTraits = (
	ai: AiAssistant,
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
	currentAI?: AiAssistant
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
		.join("\n");

	return start + "\n" + info;
};

export const promptExamples = (ai: AiAssistant): string => {
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

export const promptRules = (ai: AiAssistant): string => {
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
			const v = m.text.map((s) => s.trim());
			const r = [`### ${m.name}:`, ...v];
			return r.join("\n");
		})
		.join("\n\n");

	return start + "\n" + conv;
};
