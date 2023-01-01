import { ChatMessage } from "src/util/Chat";
import { getRoboHashAvatarUrl, getPicsumImgUrl } from "src/util/Utils";

interface RandomMsgConfig {
	numMsgMin: number;
	numMsgMax: number;
	numSeedMin: number;
	numSeedMax: number;
}

export const getRandomTextStr = () => {
	const chunks = [
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
		"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
		"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
	];
	return chunks[Math.floor(Math.random() * chunks.length)];
};

const generateMessage = (seed: string, config?: RandomMsgConfig): ChatMessage => {
	const cfg = {
		numTextMin: config?.numMsgMin || 1,
		numTextMax: config?.numMsgMax || 3,
		numImageMin: config?.numSeedMin || 0,
		numImageMax: config?.numSeedMax || 3,
	};

	const text = [];
	const numText = Math.floor(Math.random() * (cfg.numTextMax - cfg.numTextMin + 1)) + cfg.numTextMin;
	for (let i = 0; i < numText; i++) {
		const txt = getRandomTextStr();
		text.push(txt);
	}

	const images = [];
	const numImage = Math.floor(Math.random() * (cfg.numImageMax - cfg.numImageMin + 1)) + cfg.numImageMin;
	for (let i = 0; i < numImage; i++) {
		const txtSeed = getRandomTextStr();
		const img = getPicsumImgUrl(txtSeed);
		images.push(img);
	}

	const avatar = getRoboHashAvatarUrl(seed);
	const stampDate = new Date();
	// use general time that can later be converted to local time
	// set days
	stampDate.setDate(stampDate.getDate() - Math.floor(Math.random() * 30));
	stampDate.setHours(Math.floor(Math.random() * 24));
	stampDate.setMinutes(Math.floor(Math.random() * 60));
	stampDate.setSeconds(Math.floor(Math.random() * 60));
	const stamp = stampDate.toISOString();

	return {
		text: text,
		images: images,
		avatar: avatar,
		name: seed,
		date: stamp,
	};
};

const generateThreadMessages = (names: Array<string>) => {
	const config = {
		numMessageMin: 20,
		numMessageMax: 100,
	};

	const messages = [];
	const numMessage =
		Math.floor(Math.random() * (config.numMessageMax - config.numMessageMin + 1)) + config.numMessageMin;
	for (let i = 0; i < numMessage; i++) {
		// pick randomly between names
		const seed = names[Math.floor(Math.random() * names.length)];
		messages.push(generateMessage(seed));
	}

	return messages;
};
