const randomMinMax = (min: number, max: number) => Math.random() * (max - min) + min
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

interface ColorConfig {
	minLightness?: number;
	maxLightness?: number;
	minSaturation?: number;
	maxSaturation?: number;
	minHue?: number;
	maxHue?: number;
	minAlpha?: number;
	maxAlpha?: number;
}

const getSeededColorHex = (seed: string, config: ColorConfig) => {
	const hue = randomMinMax(config.minHue ?? 0, config.maxHue ?? 360)
	const saturation = randomMinMax(config.minSaturation ?? 0, config.maxSaturation ?? 100)
	const lightness = randomMinMax(config.minLightness ?? 0, config.maxLightness ?? 100)
	const alpha = randomMinMax(config.minAlpha ?? 0, config.maxAlpha ?? 1)

	return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}
const baseQuasarColors = [
	"red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan", "teal", "green", "light-green",
	"lime", "yellow", "amber", "orange", "deep-orange", "brown", "grey", "blue-grey"
]
// for each number 1 through 14 inclusive
const allQuasarColors = Array.from(Array(15).keys()).map(i => {
	// add the number to the baseQuasarColors array
	if (i === 0) return baseQuasarColors
	return baseQuasarColors.map(c => c + "-" + i)
})

export const getSeededQColor = (seed: string | number, minNum?: number, maxNum?: number) => {
	// based on the seed pick a color from the list of all quasar colors
	// do not use random here, because we want the same seed to always return the same color
	minNum = minNum ?? 0
	maxNum = maxNum ?? allQuasarColors.length - 1
	// create a flat list of all colors between minNum and maxNum inclusive
	// now interleave the colors
	const interleavedColors = allQuasarColors.slice(minNum, maxNum + 1).reduce((acc, val) => {
		val.forEach((v, i) => {
			if (!acc[i]) acc[i] = []
			acc[i].push(v)
		})
		return acc
	}, [] as string[][])
	// now flatten the array
	const flattenedColors = interleavedColors.flat()
	if (typeof seed === "string") {
		seed = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
	}

	return flattenedColors[seed % flattenedColors.length]
}