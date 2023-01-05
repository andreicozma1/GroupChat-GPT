import {ChatMessage} from "src/util/chat/ChatModels";
import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {GenerationResult} from "stores/compStore";
import {buildMessage, createMessageFromAiKey} from "src/util/chat/ChatUtils";
import {Assistant} from "src/util/assistant/AssistantModels";

export const handleAssistant = async (msg: ChatMessage, comp: any) => {
	const cfg = AssistantConfigs[msg.userId];
	msg.isCompRegen = msg.result?.contextIds
		? msg.result.contextIds.length > 0
		: false;

	if (msg.isCompRegen) {
		console.warn("=> Regen");
		msg.loading = true;
		msg.textSnippets = [];
		msg.imageUrls = [];
	}

	const res: GenerationResult = await comp.generate(
		cfg,
		msg.result?.contextIds
	);
	console.log(res);
	msg.result = res.result;
	msg.cached = res.cached;

	if (res.errorMsg) {
		msg.textSnippets.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(msg);
		return;
	}

	// if (msg.isCompRegen) {
	// 	console.warn("=> Regen");
	// 	msg.textSnippets = [];
	// 	msg.imageUrls = [];
	// }

	if (res?.textSnippets) msg.textSnippets.push(...res.textSnippets);
	if (res?.imageUrls) msg.imageUrls.push(...res.imageUrls);

	// const totalLength = msg.textSnippets.reduce((a, b) => a + b.length, 0) + msg.images.reduce((a, b) => a + b.length, 0)
	// const sleepTime = totalLength * 25
	// console.log(`sleepTime: ${sleepTime}`)
	// await sleep(sleepTime)

	comp.pushMessage(msg);

	const requiredFollowUps = cfg?.allowPromptFollowUps
		? cfg.allowPromptFollowUps
		: false;
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
				comp,
				msg
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
	const cfg: Assistant = AssistantConfigs.coordinator;
	const msg: ChatMessage = buildMessage(cfg, comp);

	const res: GenerationResult = await comp.generate(cfg);
	console.log(res);
	msg.result = res.result;
	msg.cached = res.cached;

	if (res.errorMsg) {
		msg.textSnippets.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(msg);
		return;
	}
	if (!res.textSnippets) {
		msg.textSnippets.push("Error: No text in result]");
		comp.pushMessage(msg);
		return;
	}
	msg.textSnippets = res.textSnippets
		? [...res.textSnippets]
		: ["An error occurred"];
	comp.pushMessage(msg);
	const nextActors = res.textSnippets
		.flatMap((t: string) => t.toLowerCase().split("\n"))
		.filter((t: string) => t.includes("respond"))
		.flatMap((t: string) => t.split(":")[1].split(","))
		.map((a: string) => a.trim().toLowerCase());

	// for each actor, call the appropriate handler
	console.log("Next Actors: ", nextActors);
	for (const nextKey of nextActors) {
		const nextMsg: ChatMessage | undefined = createMessageFromAiKey(
			nextKey,
			comp,
			msg
		);
		if (!nextMsg) return;
		if (orderedResponses) {
			await handleAssistant(nextMsg, comp);
		} else {
			handleAssistant(nextMsg, comp);
		}
	}
};
