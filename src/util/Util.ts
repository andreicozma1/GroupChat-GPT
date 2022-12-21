export const randomMinMax = (min: number, max: number) => Math.random() * (max - min) + min

export const getSeededAvatarURL = (seed: string) => {
	return `https://robohash.org/${seed}`
}

interface ImageOptions {
	width?: number;
	height?: number;
}

export const getSeededImageURL = (seed: string, options?: ImageOptions) => {
	const w = options?.width || Math.round(randomMinMax(100, 800))
	const h = options?.height || Math.round(randomMinMax(100, 800))
	seed = seed.replace(/ /g, "_")
	return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

export const getRandomTextStr = () => {
	const chunks = [
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
		"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
		"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	]
	return chunks[Math.floor(Math.random() * chunks.length)]
}


