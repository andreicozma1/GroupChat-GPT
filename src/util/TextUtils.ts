export const wrapInTag = (tag: string, ...msgPrompt: string[]) => {
	return [`<${tag}>`, ...msgPrompt, `</${tag}>`].join("\n");
};

export const getCodeBlock = (lang: string, ...lines: string[]): string => {
	let res = "```" + lang + "\n";
	for (let i = 0; i < lines.length; i++) {
		res += lines[i] + "\n";
	}
	res += "```\n";
	return res;
};

export const getNewlineSeparated = (...lines: string[]): string => {
	let res = "";
	for (let i = 0; i < lines.length; i++) {
		res += lines[i] + "\n";
	}
	res += "\n";
	return res;
};

export const getSingularOrPlural = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};
