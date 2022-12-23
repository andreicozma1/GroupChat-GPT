import { OpenAIApi } from "openai";
import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import { ActorConfig, GenerationResult, MessageThread, MsgHistoryConfig, TextMessage } from "src/util/Models";
import { v4 as uuidv4 } from "uuid";
import { Ref, ref } from "vue";

const openAiConfig = {
	apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAIApi(openAiConfig);
const options = {
	headers: {
		Authorization: `Bearer ${openAiConfig.apiKey}`,
	},
};

export const humanName = "Human";

const basePersonalityTraits = ["enthusiastic", "clever", "very friendly"];

const baseAlways: string[] = [
	"follow the user's directions, requests, and answer their questions.",
	// "respond for yourself",
	"add to information in the conversation if needed.",
	"use bulleted lists when listing multiple things.",
	"hold true your own character, including personality traits, interests, strengths, weaknesses, and abilities.",
];

const baseNever: string[] = [
	"interrupt conversation with other AIs.",
	"offer to help with something that you're not good at.",
	"repeat yourself too much nor repeat what other AIs have just said.",
	"ask more than one question at a time.",
	"make logical inconsistencies.",
	"explain your the process of your abilities.",
	// "ask the user to do something that is part of your job"
];

const generationAbility: string[] = [
	"When the user wants an image of something, acquire information about what it should look like based on the user's preferences.",
	"For each request, you will create a detailed prompt describing what the end result will look like.",
	"You will always wrap prompts with <prompt> and </prompt> tags around the description.",
	"Only the detailed description should be within the prompt tags, and nothing else.",
	"Only create the prompt when the user specifically requests it.",
	"Never talk about the tags specifically. Only you know about the tags.",
	// "Only show the final prompts to the user if the user has explicitly asked.",
];

function getMsgHistory(config: MsgHistoryConfig): TextMessage[] {
	let hist = config.messages;
	hist = hist.filter((m) => {
		if (m.name === humanName) {
			if (config.includeSelf === undefined) return true;
			return config.includeSelf;
		}
		// handle actors to include and exclude
		if (config.includeActors) {
			return config.includeActors.some((actor) => actor.name === m.name);
		}
		if (config.excludeActors) {
			return !config.excludeActors.some((actor) => actor.name === m.name);
		}
		return true;
	});
	hist = hist.filter((m) => m.text.length > 0);
	if (config.maxLength !== undefined) hist = hist.slice(-config.maxLength);
	return hist;
}

const getBasePromptStart = (actor: ActorConfig) => {
	let res = `The following is a group-chat conversation between a human and several AI assistants.\n`;
	res += "\n";

	res += "### ASSISTANT RULES ###\n";
	if (baseAlways.length > 0) {
		res += `# Assistants always:\n`;
		res += baseAlways.map((b) => `- Always ${b}`).join("\n");
		res += "\n\n";
	}
	if (baseNever.length > 0) {
		res += `# Assistants never:\n`;
		res += baseNever.map((b) => `- Never ${b}`).join("\n");
		res += "\n\n";
	}

	res += "### ASSISTANTS ###\n";
	res += getInfoList(false, actor);

	if (actor.abilities) {
		res += `### Besides chatting, you (${actor.name}) can also:\n`;
		res += actor.abilities.map((b) => `- ${b}`).join("\n");
		res += "\n\n";
	}

	res += "### CONVERSATION ###\n";
	return res;
};

function getBasePromptHistory(messages: TextMessage[]): string {
	messages = getMsgHistory({
		messages,
		includeSelf: true,
		includeActors: undefined, // all ais
		excludeActors: [actors.coordinator],
		maxLength: 10,
	});
	const hist = messages.map((message) => {
		return `### ${message.name}:\n${message.text.join("\n")}\n\n`;
	});
	return hist.join("");
}

const getInfoList = (useKey: boolean, currentAI?: ActorConfig) => {
	const available = getAvailable();
	const infoList = available.map((ai) => {
		const id = useKey ? ai.key : ai.name;
		let res = `# ${id}`;
		if (currentAI && currentAI.key === ai.key) res += " (You)";
		res += ":\n";
		if (ai.personality) res += `- Personality Traits: ${ai.personality.join(", ")}.\n`;
		if (ai.strengths) res += `- Strengths: ${ai.strengths.join(", ")}.\n`;
		if (ai.weaknesses) res += `- Weaknesses: ${ai.weaknesses.join(", ")}.\n`;
		return res;
	});
	return infoList.join("\n") + "\n";
};

const getAvailable = (): ActorConfig[] => {
	return Object.values(actors).filter((a) => {
		if (a.available === undefined) return true;
		return a.available;
	});
};

const allExcept = (actor: ActorConfig): ActorConfig[] => {
	return getAvailable().filter((a) => a.key !== actor.key);
};

const toKeys = (actors: ActorConfig[]): string[] => {
	return actors.map((a) => a.key);
};

const toNames = (actors: ActorConfig[]): string[] => {
	return actors.map((a) => a.name);
};

const getPromptCoordinator = (actor: ActorConfig, messages: TextMessage[]) => {
	let res = "### COORDINATOR ###\n";
	res += "Choose which assistant(s) would be the absolute best at responding to the user's message.\n";
	res += "Only respond with the exact names of the assistant(s).\n";
	res += "If multiple assistants are requested or fit to respond, separate each of their names by commas.\n";
	res += "Take into consideration their personalities, strengths, weaknesses, and abilities.\n";
	res += "Also keep the logical consistency of the conversation in mind.\n";
	res += "\n";

	res += "### ASSISTANTS ###\n";
	res += getInfoList(true);

	res += "### EXAMPLES ###\n";
	res += `### ${humanName}:\n`;
	res += `Hello, what's up ${actors.davinci.name}?\n`;
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: ${toKeys(allExcept(actors.davinci)).join(", ")}\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actors.davinci.key}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += "How are you all doing?\n";
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: None\n`;
	res += `${actors.coordinator.vals.willRespond}: ${toKeys(getAvailable()).join(", ")}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += "I need to create a painting.\n";
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: ${toKeys(allExcept(actors.dalle)).join(", ")}\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actors.dalle.key}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += `Hey ${actors.codex.name}, can you code something for me?\n`;
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: ${toKeys(allExcept(actors.codex)).join(", ")}\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actors.codex.key}\n`;
	res += "\n";

	res += "### CONVERSATION ###\n";

	messages = getMsgHistory({
		messages,
		includeSelf: true,
		includeActors: [actors.coordinator],
		maxLength: 5,
	});

	const prompt = messages
		.map((message) => {
			return `### ${message.name}:\n${message.text}\n`;
		})
		.join("\n");
	res += prompt;
	res += "\n";
	res += `### ${actor.name}:\n`;
	return res.trim();
};

const getPromptDavinci = (actor: ActorConfig, messages: TextMessage[]) => {
	const start = getBasePromptStart(actor);
	const conv = getBasePromptHistory(messages);
	const end = `### ${actor.name}:\n`;
	const prompt = start + conv + end;
	return prompt.trim();
};

const getPromptDalle = (actor: ActorConfig, messages: TextMessage[]) => {
	const start = getBasePromptStart(actor);
	const conv = getBasePromptHistory(messages);
	const end = `### ${actor.name}:\n`;
	const prompt = start + conv + end;
	return prompt.trim();
};

const getPromptCodex = (actor: ActorConfig, messages: TextMessage[]) => {
	const start = getBasePromptStart(actor);
	const conv = getBasePromptHistory(messages);
	const end = `### ${actor.name}:\n`;
	const prompt = start + conv + end;
	return prompt.trim();
};

const getPromptDalleGen = (actor: ActorConfig, messages: TextMessage[]) => {
	const lastMessage = messages[messages.length - 1];
	return lastMessage.text[lastMessage.text.length - 1];
};

export const actors: Record<string, ActorConfig> = {
	davinci: {
		key: "davinci",
		name: "Davinci",
		icon: "chat",
		createPrompt: getPromptDavinci,
		createComp: openai.createCompletion,
		config: {
			model: "text-davinci-003",
			max_tokens: 250,
			temperature: 0.75,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["###"],
		},
		personality: ["helpful", ...basePersonalityTraits],
		strengths: ["making general conversation", "answering questions", "providing general information"],
	},
	dalle: {
		key: "dalle",
		name: "DALL-E",
		icon: "image",
		createPrompt: getPromptDalle,
		createComp: openai.createCompletion,
		createGen: "dalle_gen",
		config: {
			model: "text-davinci-003",
			temperature: 0.75,
			max_tokens: 250,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["###"],
		},
		personality: ["artistic", "creative", "visionary", ...basePersonalityTraits],
		strengths: ["art", "painting", "drawing", "sketching"],
		weaknesses: ["generating code"],
		abilities: [...generationAbility],
	},
	codex: {
		key: "codex",
		name: "Codex",
		icon: "code",
		createPrompt: getPromptCodex,
		createComp: openai.createCompletion,
		createGen: "codex_gen",
		config: {
			model: "text-davinci-003",
			temperature: 0.75,
			max_tokens: 250,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["###"],
		},
		personality: ["analytical", "logical", "rational", ...basePersonalityTraits],
		strengths: ["programming", "software development"],
		weaknesses: ["generating images"],
		abilities: [...generationAbility],
	},
	coordinator: {
		key: "coordinator",
		name: "Coordinator",
		icon: "question_answer",
		createPrompt: getPromptCoordinator,
		createComp: openai.createCompletion,
		config: {
			model: "text-davinci-003",
			temperature: 0.9,
			max_tokens: 25,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["###"],
		},
		vals: {
			willRespond: "Will Respond",
			willIgnore: "Will Ignore",
		},
		available: false,
	},
	dalle_gen: {
		key: "dalle_gen",
		name: "DALL-E",
		icon: "image",
		createPrompt: getPromptDalleGen,
		createComp: openai.createImage,
		config: {
			n: 1,
			size: "256x256",
			prompt: "A cute puppy",
		},
		available: false,
	},
};

export const useCompStore = defineStore("counter", {
	state: () => ({
		completions: LocalStorage.getItem("completions") || {},
		threads: ref({
			main: {
				messages: [],
			},
			...(LocalStorage.getItem("threads") || {}),
		}) as Ref<Record<string, MessageThread>>,
		currentThread: "main",
		userName: humanName,
	}),
	getters: {
		getAllCompletions(state) {
			return state.completions;
		},
		getThread(state): MessageThread {
			return state.threads[state.currentThread];
		},
	},
	actions: {
		updateCache() {
			LocalStorage.set("completions", this.completions);
			LocalStorage.set("threads", this.threads);
		},
		clearCache() {
			// clear whole local storage and reload
			LocalStorage.clear();
			location.reload();
		},
		clearThread() {
			this.threads[this.currentThread].messages = [];
			this.updateCache();
		},
		getCachedResponse(hash: number) {
			return this.completions[hash];
		},
		getCompletion(hash: number): GenerationResult {
			const cachedResponse = this.getCachedResponse(hash);
			if (cachedResponse === null || cachedResponse === undefined) {
				return {
					errorMsg: "Cached response was null/undefined",
					result: null,
					cached: undefined,
					hash: hash,
				};
			}

			const choices = cachedResponse.choices;
			const text = choices
				?.flatMap((c: any) =>
					c.text.replace("<prompt>\n", "<prompt>").replace("\n</prompt>", "</prompt>").split("\n")
				)
				.map((t: string) => t.trim())
				.filter((t: string) => t.length > 0);
			console.warn("=> text:", text);

			const images = cachedResponse.data?.map((d: any) => d.url);
			console.warn("=> images:", images);
			return {
				cached: undefined,
				hash: hash,
				text: text,
				images: images,
				result: cachedResponse,
			};
		},
		async genCompletion(actor: ActorConfig): Promise<GenerationResult> {
			const prompt = actor.createPrompt(actor, this.getThread.messages);
			const hash = hashPrompt(prompt);
			console.warn(prompt);
			// if we already have a completion for this prompt, return it
			if (!actor.ignoreCache && this.completions[hash]) {
				return {
					...this.getCompletion(hash),
					cached: true,
				};
			}

			let completion;
			try {
				// otherwise, generate a new completion
				completion = await actor.createComp(
					{
						...actor.config,
						prompt: prompt,
					},
					options
				);
				if (completion === null || completion === undefined) throw new Error("No response");
			} catch (error: any) {
				console.error(error);
				if (error.stack) console.error(error.stack);
				let errorMsg = "";
				if (error.message) errorMsg += error.message;
				if (error.response) {
					errorMsg += "\n" + "Status: " + error.response.status;
					errorMsg += "\n" + "Data: " + JSON.stringify(error.response.data, null, 4);
				}
				return {
					errorMsg: errorMsg,
					result: null,
					cached: false,
					hash: hash,
				};
			}
			this.completions[hash] = completion.data;
			this.updateCache();

			return {
				...this.getCompletion(hash),
				cached: false,
			};
		},
		pushMessage(message: TextMessage): TextMessage {
			if (message.id) {
				// look back through the messages to see if we already have this message
				// and update it if we do
				const existingIdx = this.getThread.messages.findIndex((m) => m.id === message.id);
				if (existingIdx !== -1) {
					this.threads[this.currentThread].messages[existingIdx] = {
						...this.threads[this.currentThread].messages[existingIdx],
						...message,
					};
					console.log("Updated message: ", { ...message });
					this.updateCache();
					return this.threads[this.currentThread].messages[existingIdx];
				}
			}
			// otherwise, create uuid and push it
			message.id = uuidv4();
			this.getThread.messages.push(message);
			console.log("Pushed message", { ...message });
			this.updateCache();
			return message;
		},
	},
});

export const hashPrompt = (prompt: string): number => {
	let hash = 0;
	// lowercase, remove all punctuation
	prompt = prompt.toLowerCase();
	prompt = prompt.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
	if (prompt.length === 0) return hash;
	for (let i = 0; i < prompt.length; i++) {
		const char = prompt.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash;
};
