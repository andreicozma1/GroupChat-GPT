// TODO: Find better name for these and move them to a separate file
export interface ItemizedListConfig {
	keyPrefix?: string;
	valJoinStr?: string;
	inline?: boolean;
	commaSepMinChars?: number;
}

export const processItemizedList = (
	key: string,
	val: string | string[],
	config?: ItemizedListConfig
): string => {
	const commaSepMinChars = config?.commaSepMinChars || 40;
	const keyPrefix: string = config?.keyPrefix || "#";
	let valJoinStr: string = config?.valJoinStr || ", ";
	let inline: boolean = config?.inline || true;

	// remove all underscores
	key = key.replace(/_/g, " ");
	// capitalize first letter
	// key = key.replace(
	// 	/\w\S*/g,
	// 	(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
	// );
	// if val is not an array, make it a one element array
	val = Array.isArray(val) ? val : [val];
	val = val.map((s: string) => s.trim());
	val = val.filter((s: string) => s.length > 0);
	if (val.some((s: string) => s.length > commaSepMinChars)) {
		valJoinStr = "\n";
		inline = false;
		val = val.map((s: string, i: number) => {
			return `${i + 1}. ${s}`;
		})
	}
	val = val.join(valJoinStr);

	return [`${keyPrefix} ${key}:`, val].join(inline ? " " : "\n");
};
