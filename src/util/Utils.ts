import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {buildMessage, createMessageFromAiKey,} from "src/util/chat/ChatUtils";

// return process.env.npm_package_version || "unknown";
import {version} from "./../../package.json";
import {Assistant} from "src/util/assistant/AssistantModels";
import {GenerationResult} from "stores/compStore";
import {ChatMessage} from "src/util/chat/ChatModels";

export const getAppVersion = () => {
	return version.trim();
};
export const getRandomMinMax = (min: number, max: number) =>
	Math.random() * (max - min) + min;

export const parseNounCount = (singularStr: string, count: number) => {
	return count === 1 ? singularStr : `${singularStr}s`;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const handleAssistant = async (msg: ChatMessage, comp: any) => {
	const cfg = AssistantConfigs[msg.userId];
	msg.isCompRegen = msg.result?.messageIds
		? msg.result.messageIds.length > 0
		: false;


	const response: GenerationResult = await comp.generate(cfg, msg.result?.messageIds);
	console.log(response);
	msg.result = response.result;
	msg.cached = response.cached;

	if (response.errorMsg) {
		msg.textSnippets.push("[ERROR]\n" + response.errorMsg);
		comp.pushMessage(msg);
		return;
	}

	if (msg.isCompRegen) {
		console.warn("=> Regen");
		msg.loading = true;
		msg.textSnippets = [];
		msg.imageUrls = [];
	}

	if (response?.textSnippets) msg.textSnippets.push(...response.textSnippets);
	if (response?.imageUrls) msg.imageUrls.push(...response.imageUrls);

	// const totalLength = msg.textSnippets.reduce((a, b) => a + b.length, 0) + msg.images.reduce((a, b) => a + b.length, 0)
	// const sleepTime = totalLength * 25
	// console.log(`sleepTime: ${sleepTime}`)
	// await sleep(sleepTime)

	comp.pushMessage(msg);

	const requiredFollowUps = cfg?.allowPromptFollowUps ? cfg.allowPromptFollowUps : false;
	// if null or undefined, exit
	if (!requiredFollowUps) {
		console.warn("=> No follow-ups");
		return;
	}
	// if string, make it an array
	// for each
	// filter out texts that contain <prompt> tags
	let prompts = msg.textSnippets
		.filter((t: string) => t.includes("<prompt>"))
		.map((t: string) =>
			t.split("<prompt>")[1].trim().split("</prompt>")[0].trim()
		);

	msg.textSnippets = msg.textSnippets.map((t: string) => {
		if (t.includes("<prompt>")) {
			const parts = t.split("<prompt>");
			const end = parts[1].split("</prompt>");
			return parts[0] + end[1];
		}

		return t.trim();
	});
	msg.textSnippets = msg.textSnippets.filter((t: string) => t.length > 0);
	// msg.textSnippets = msg.textSnippets.map((t: string) => t.replace("<prompt>", "").replace("</prompt>", ""))
	comp.pushMessage(msg);

	prompts = prompts.filter((t: string) => t.split(" ").length > 3);
	if (prompts.length > 0) {
		console.log("promptText", prompts);
		const nextKey = `${msg.userId}_gen`;
		for (let i = 0; i < prompts.length; i++) {
			const prompt = prompts[i];
			const nextMsg: ChatMessage | undefined = createMessageFromAiKey(
				nextKey,
				comp
			);
			if (!nextMsg) return;
			nextMsg.textSnippets.push(`<prompt>${prompt}</prompt>`);
			comp.pushMessage(nextMsg);
			await handleAssistant(nextMsg, comp);
		}
	}
};
export const handleCoordinator = async (
	comp: any,
	orderedResponses?: boolean
) => {
	orderedResponses = orderedResponses === undefined ? true : orderedResponses;
	const coordConf: Assistant = AssistantConfigs.coordinator;
	const coordMsg: ChatMessage = buildMessage(coordConf, comp);

	const response: GenerationResult = await comp.generate(coordConf);
	console.log(response);
	coordMsg.result = response.result;
	coordMsg.cached = response.cached;

	if (response.errorMsg) {
		coordMsg.textSnippets.push("[ERROR]\n" + response.errorMsg);
		comp.pushMessage(coordMsg);
		return;
	}
	if (!response.textSnippets) {
		coordMsg.textSnippets.push("Error: No text in result]");
		comp.pushMessage(coordMsg);
		return;
	}
	coordMsg.textSnippets = response.textSnippets ? [...response.textSnippets] : ["An error occurred"];
	comp.pushMessage(coordMsg);
	const nextActors = response.textSnippets
		.flatMap((t: string) => t.toLowerCase().split("\n"))
		.filter((t: string) => t.includes("respond"))
		.flatMap((t: string) => t.split(":")[1].split(","))
		.map((a: string) => a.trim().toLowerCase());

	// for each actor, call the appropriate handler
	console.log("Next Actors: ", nextActors);
	for (const nextKey of nextActors) {
		// nextKey = nextKey.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
		// const nextCfg: AssistantConfig = AssistantConfigs[nextKey];
		// const nextMsg = createMessageFromConfig(nextCfg, comp);
		// if (!nextCfg) {
		// 	nextMsg.textSnippets.push(`[Error: Unknown assistant key: ${nextKey}]`);
		// 	nextMsg.loading = false;
		// 	comp.pushMessage(nextMsg);
		// 	return;
		// }
		const nextMsg: ChatMessage | undefined = createMessageFromAiKey(
			nextKey,
			comp
		);
		if (!nextMsg) return;
		if (orderedResponses) {
			await handleAssistant(nextMsg, comp);
		} else {
			handleAssistant(nextMsg, comp);
		}
	}
};
