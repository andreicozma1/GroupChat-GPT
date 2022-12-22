import { getRandomTextStr, getSeededAvatarURL, getSeededImageURL } from "src/util/Util"
import { TextMessage } from "stores/compStore"

interface RandomMsgConfig {
	numMsgMin: number;
	numMsgMax: number;
	numSeedMin: number;
	numSeedMax: number;
}

const generateMessage = (seed: string, config?: RandomMsgConfig): TextMessage => {
	const cfg = {
		numTextMin : config?.numMsgMin || 1,
		numTextMax : config?.numMsgMax || 3,
		numImageMin: config?.numSeedMin || 0,
		numImageMax: config?.numSeedMax || 3
	}

	const text = []
	const numText = Math.floor(Math.random() * (cfg.numTextMax - cfg.numTextMin + 1)) + cfg.numTextMin
	for (let i = 0; i < numText; i++) {
		const txt = getRandomTextStr()
		text.push(txt)
	}

	const images = []
	const numImage = Math.floor(Math.random() * (cfg.numImageMax - cfg.numImageMin + 1)) + cfg.numImageMin
	for (let i = 0; i < numImage; i++) {
		const txtSeed = getRandomTextStr()
		const img = getSeededImageURL(txtSeed)
		images.push(img)
	}

	const avatar = getSeededAvatarURL(seed)
	const stampDate = new Date()
	// use general time that can later be converted to local time
	// set days
	stampDate.setDate(stampDate.getDate() - Math.floor(Math.random() * 30))
	stampDate.setHours(Math.floor(Math.random() * 24))
	stampDate.setMinutes(Math.floor(Math.random() * 60))
	stampDate.setSeconds(Math.floor(Math.random() * 60))
	const stamp = stampDate.toISOString()

	return {
		text  : text,
		images: images,
		avatar: avatar,
		name  : seed,
		date  : stamp
	}
}
const generateThreadMessages = (names: Array<string>) => {
	const config = {
		numMessageMin: 20,
		numMessageMax: 100
	}

	const messages = []
	const numMessage = Math.floor(
		Math.random() * (config.numMessageMax - config.numMessageMin + 1)) + config.numMessageMin
	for (let i = 0; i < numMessage; i++) {
		// pick randomly between names
		const seed = names[Math.floor(Math.random() * names.length)]
		messages.push(generateMessage(seed))
	}

	return messages
}
