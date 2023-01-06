import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {Assistant, ProcessKVConfig} from "src/util/assistant/AssistantModels";

export const getAisAvailable = (): Assistant[] => {
	return Object.values(AssistantConfigs).filter((a) => {
		if (a.isAvailable === undefined) return true;
		return a.isAvailable;
	});
};

export const getAisAvailableExcept = (actor: Assistant): Assistant[] => {
	let res = getAisAvailable();
	res = res.filter((a) => a.id !== actor.id);
	return res;
};

export const getAiIds = (actors: Assistant[]): string[] => {
	return actors.map((a) => a.id);
};

export const getAiNames = (actors: Assistant[]): string[] => {
	return actors.map((a) => a.name);
};

// TODO: Find better name for these and move them to a separate file
export const processKV = (
	key: string,
	val: string | string[],
	config?: ProcessKVConfig
): string => {
	const keyStartChar: string = config?.keyStartChar || "#";
	let valJoinStr: string = config?.valJoinStr || ", ";
	let inline: boolean = config?.inline || true;

	key = key.replace(/_/g, " ");
	key = key.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	);
	val = Array.isArray(val) ? val : [val];
	val = val.map((s: string) => s.trim());
	if (val.every((s: string) => s.length > 50)) {
		valJoinStr = "\n";
		inline = false;
		val = val.map((s: string) => `- ${s}`);
	}
	val = val.join(valJoinStr);

	return [`${keyStartChar} ${key}:`, val].join(inline ? " " : "\n");
};

export const createExamplePrompt = (...message: string[]): string => {
	let res = "<prompt>\n"
	for (let i = 0; i < message.length; i++) {
		res += message[i] + "\n"
	}
	res += "</prompt>\n"
	return res
}

export const createCodeBlock = (lang: string, ...lines: string[]): string => {
	let res = "```" + lang + "\n"
	for (let i = 0; i < lines.length; i++) {
		res += lines[i] + "\n"
	}
	res += "```\n"
	return res
}