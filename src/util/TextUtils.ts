import {
	createRegexHtmlTagEnd,
	createRegexHtmlTagStart,
	createRegexHtmlTagWithContent,
	rHtmlTagEnd,
	rHtmlTagStart,
	rHtmlTagWithContent
} from "src/util/Utils";


export const getSingularOrPlural = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};


export const wrapWithHtmlTag = (tag: string, ...msgPrompt: string[]) => {
	return [`<${tag}>`, ...msgPrompt, `</${tag}>`].join("\n");
};

export const wrapInCodeBlock = (lang: string, ...lines: string[]): string => {
	let res = "```" + lang + "\n";
	for (let i = 0; i < lines.length; i++) {
		res += lines[i] + "\n";
	}
	res += "```\n";
	return res;
};

export const newlineSeparated = (...lines: string[]): string => {
	let res = "";
	for (let i = 0; i < lines.length; i++) {
		res += lines[i] + "\n";
	}
	res += "\n";
	return res;
};


export const removeAllHtmlTags = (text: string, removeContent = false): string => {
	if (removeContent) {
		text = text.replace(rHtmlTagWithContent, "");
	} else {
		text = text.replace(rHtmlTagStart, "");
		text = text.replace(rHtmlTagEnd, "");
	}
	return text.trim();
}

export const removeSpecifiedHtmlTags = (text: string, tag: string | string[], removeContent = false): string => {
	if (!Array.isArray(tag)) tag = [tag];
	tag.forEach((t) => {
		if (removeContent) {
			text = text.replace(createRegexHtmlTagWithContent(t), "");
		} else {
			text = text.replace(createRegexHtmlTagStart(t), "");
			text = text.replace(createRegexHtmlTagEnd(t), "");
		}
	});
	return text.trim();
}

export const getTextHash = (prompt: string): string => {
	// TODO: use a better hash function
	const hashStr = "undefined";
	// lowercase, remove all punctuation
	let promptText = prompt.toLowerCase();
	promptText = promptText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
	promptText = promptText.trim();
	if (promptText.length === 0) return hashStr;

	let hashInt = 0;
	for (let i = 0; i < promptText.length; i++) {
		const char = promptText.charCodeAt(i);
		hashInt = (hashInt << 5) - hashInt + char;
		hashInt = hashInt & hashInt;
	}
	return hashInt.toString();
};