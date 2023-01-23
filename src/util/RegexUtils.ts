export const validTagPattern = '[a-zA-Z0-9_-]+'
export const getStrHtmlTagStart = (tag = validTagPattern) => {
	return `<(${tag})>\\s*`
};
export const getStrHtmlTagEnd = (tag = validTagPattern) => {
	return `\\s*</?(${tag})>`
};
export const getStrHtmlTagWithContent = (tag = validTagPattern) => {
	const content = '(.+?)';
	return `${getStrHtmlTagStart(tag)}${content}${getStrHtmlTagEnd(tag)}`
};
export const createRegexHtmlTagWithContent = (tag = validTagPattern) => {
	return new RegExp(getStrHtmlTagWithContent(tag), 'gis');
};
export const createRegexHtmlTagStart = (tag = validTagPattern) => {
	return new RegExp(getStrHtmlTagStart(tag), 'gis');
};
export const createRegexHtmlTagEnd = (tag = validTagPattern) => {
	return new RegExp(getStrHtmlTagEnd(tag), 'gis');
};