import {AiAssistantConfigs} from "src/util/assistant/AiAssistantConfigs";
import {AiAssistant, ProcessKVConfig} from "src/util/assistant/AiAssistantModels";

export const getAisAvailable = (): AiAssistant[] => {
	return Object.values(AiAssistantConfigs).filter((a) => {
		if (a.isAvailable === undefined) return true;
		return a.isAvailable;
	});
};

export const getAisAvailableExcept = (actor: AiAssistant): AiAssistant[] => {
	let res = getAisAvailable()
	res = res.filter((a) => a.key !== actor.key);
	return res;
};

export const getAiIds = (actors: AiAssistant[]): string[] => {
	return actors.map((a) => a.key);
};

export const getAiNames = (actors: AiAssistant[]): string[] => {
	return actors.map((a) => a.name);
};

// TODO: Find better name for these and move them to a separate file
export const processKV = (key: string, val: string | string[], config?: ProcessKVConfig): string => {
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
