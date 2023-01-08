import {ProcessKVConfig} from "src/util/assistant/AssistantModels";


// TODO: Find better name for these and move them to a separate file
export const processKV = (
	key: string,
	val: string | string[],
	config?: ProcessKVConfig
): string => {
	const keyStartChar: string = config?.keyPrefix || "#";
	let valJoinStr: string = config?.valJoinStr || ", ";
	let inline: boolean = config?.inline || true;
	const valStart: string = config?.valPrefix || "";
	const commaSepMinChars = config?.commaSepMinChars || 40;

	// remove all underscores
	key = key.replace(/_/g, " ");
	// capitalize first letter
	key = key.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	);
	// if val is not an array, make it a one element array
	val = Array.isArray(val) ? val : [val];
	val = val.map((s: string) => s.trim());
	val = val.filter((s: string) => s.length > 0);
	if (val.some((s: string) => s.length > commaSepMinChars)) {
		valJoinStr = "\n";
		inline = false;
		val = val.map((s: string) => `- ${valStart} ${s.toLowerCase()}`);
	}
	val = val.join(valJoinStr);

	return [`${keyStartChar} ${key}:`, val].join(inline ? " " : "\n");
};

export const createExamplePrompt = (...message: string[]): string => {
	let res = "<prompt>\n"
	for (let i = 0; i < message.length; i++) {
		res += message[i] + "\n"
	}
	res += "</prompt>"
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

export const createMarkdown = (...lines: string[]): string => {
	let res = ""
	for (let i = 0; i < lines.length; i++) {
		res += lines[i] + "\n"
	}
	res += "\n"
	return res
}