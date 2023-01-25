import {createRegexHtmlTagEnd, createRegexHtmlTagStart, createRegexHtmlTagWithContent} from "src/util/RegexUtils";

/*
 Capitalize the first letter of each word in a string
 */
export const capitalizeFirstLetter = (str: string) => {
	// return str.charAt(0).toUpperCase() + str.slice(1);
	let words = str.split(" ");
	words = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
	return words.join(" ");
}

export const getSingularOrPlural = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};


export const wrapInCodeBlock = (lang: string, ...lines: string[]): string => {
	let res = "```" + lang + "\n";
	// for (let i = 0; i < lines.length; i++) {
	// 	res += lines[i] + "\n";
	// }
	res += lines.join("\n");
	res += "\n";
	res += "```";
	return res;
};

export const newlineSeparated = (...lines: string[]): string => {
	// let res = "";
	// for (let i = 0; i < lines.length; i++) {
	// 	res += lines[i] + "\n";
	// }
	// res += "\n";
	return lines.join("\n")
};

export const removeAllHtmlTags = (
	text: string,
	removeContent = false
): string => {
	if (removeContent) {
		text = text.replace(createRegexHtmlTagWithContent(), "");
	} else {
		text = text.replace(createRegexHtmlTagStart(), "");
		text = text.replace(createRegexHtmlTagEnd(), "");
	}
	return text.trim();
};

export const removeSpecifiedHtmlTags = (
	text: string,
	tag: string | string[],
	removeContent = false
): string => {
	if (!Array.isArray(tag)) {
		tag = [tag];
	}
	tag.forEach((t) => {
		const withContentRegex = createRegexHtmlTagWithContent(t)
		if (removeContent) {
			text = text.replace(withContentRegex, "");
		} else {
			// get the inner text
			const innerText = text.matchAll(withContentRegex);
			for (const match of innerText) {
				text = text.replace(match[0], match[2]);
			}
			// text = text.replace(createRegexHtmlTagStart(t), "");
			// text = text.replace(createRegexHtmlTagEnd(t), "");
		}
	});
	return text.trim();
};

export const getTextHash = (prompt: string): string => {
	// TODO: use a better hash function
	const hashStr = "undefined";
	// lowercase, remove all punctuation
	let promptText = prompt.toLowerCase();
	promptText = promptText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
	promptText = promptText.trim();
	if (promptText.length === 0) {
		return hashStr;
	}

	let hashInt = 0;
	for (let i = 0; i < promptText.length; i++) {
		const char = promptText.charCodeAt(i);
		hashInt = (hashInt << 5) - hashInt + char;
		hashInt = hashInt & hashInt;
	}
	return hashInt.toString();
};
