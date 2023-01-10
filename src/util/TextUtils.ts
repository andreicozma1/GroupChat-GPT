export const wrapInTags = (tag: string, ...msgPrompt: string[]) => {
	return [
		`<${tag}>`,
		msgPrompt,
		`</${tag}>`
	].join("\n");
}

export const wrapInPrompt = (...message: string[]): string => {
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

export const getSingularOrPlural = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};