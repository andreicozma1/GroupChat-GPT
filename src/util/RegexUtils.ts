export const validUserIdPattern = '[a-zA-Z0-9_.-]+'

export const getRegexValidUserId = () => {
    return new RegExp(`^[a-zA-Z0-9_.-]+$`, 'g');
}
export const getStrHtmlTagStart = (tag = validUserIdPattern) => {
    return `<(${tag})>\\s*`
};
export const getStrHtmlTagEnd = (tag = validUserIdPattern) => {
    return `\\s*</?(${tag})>`
};
export const getStrHtmlTagWithContent = (tag = validUserIdPattern) => {
    const content = '(.+?)';
    return `${getStrHtmlTagStart(tag)}${content}${getStrHtmlTagEnd(tag)}`
};
export const createRegexHtmlTagWithContent = (tag = validUserIdPattern) => {
    return new RegExp(getStrHtmlTagWithContent(tag), 'gis');
};
export const createRegexHtmlTagStart = (tag = validUserIdPattern) => {
    return new RegExp(getStrHtmlTagStart(tag), 'gis');
};
export const createRegexHtmlTagEnd = (tag = validUserIdPattern) => {
    return new RegExp(getStrHtmlTagEnd(tag), 'gis');
};