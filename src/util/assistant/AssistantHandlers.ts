import {ChatMessage, ChatThread} from "src/util/chat/ChatModels";
import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {GenerationResult} from "stores/compStore";
import {createMessageFromUserCfg, createMessageFromUserId} from "src/util/chat/ChatUtils";
import {ConfigCoordinator} from "src/util/assistant/configs/ConfigCoordinator";
import {Assistant} from "src/util/assistant/AssistantModels";

export const handleAssistantCfg = (cfg: Assistant, comp: any) => {
	const msg = createMessageFromUserCfg(cfg, comp);
	return handleAssistantMsg(msg, comp);
}

const handleAssistantId = async (nextKey: string, comp: any) => {
	const nextMsg: ChatMessage = createMessageFromUserId(
		nextKey,
		comp
	);
	return handleAssistantMsg(nextMsg, comp);
}

export const handleAssistantMsg = async (msg: ChatMessage, comp: any) => {
	const cfg = AssistantConfigs[msg.userId];
	console.warn("*".repeat(40));

	console.warn(`=> handleAssistantMsg (${msg.userId})`);
	console.log("=> msg:", msg);

	msg.isCompRegen = msg.result?.contextIds
		? msg.result.contextIds.length > 0
		: false;
	console.log("=> msg.isCompRegen:", msg.isCompRegen);

	// if (msg.isCompRegen) {
	// 	console.warn("=> Regen");
	// 	msg.textSnippets = [];
	// 	msg.imageUrls = [];
	// }
	comp.pushMessage(msg, true);

	const res: GenerationResult = await comp.generate(
		cfg,
		msg.result?.contextIds
	);
	console.log("=> res:", res);
	msg.result = res.result;
	msg.cached = res.cached;

	if (res.errorMsg) {
		console.error("=> res.errorMsg:", res.errorMsg);
		msg.textSnippets.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(msg, false);
		return;
	}

	// if (msg.isCompRegen) {
	// 	console.warn("=> Regen");
	// 	msg.textSnippets = [];
	// 	msg.imageUrls = [];
	// }

	if (res?.textSnippets) {
		msg.textSnippets = res.textSnippets
	}
	if (res?.imageUrls) {
		msg.imageUrls = res.imageUrls
	}

	// const totalLength = msg.textSnippets.reduce((a, b) => a + b.length, 0) + msg.images.reduce((a, b) => a + b.length, 0)
	// const sleepTime = totalLength * 25
	// console.log(`sleepTime: ${sleepTime}`)
	// await sleep(sleepTime)

	// comp.pushMessage(msg);

	// const requiredFollowUps = cfg?.allowPromptFollowUps
	// 	? cfg.allowPromptFollowUps
	// 	: false;
	//
	// if (!requiredFollowUps) {
	// 	console.warn("=> No follow-ups");
	// 	return;
	// }

	const nextActors = msg.textSnippets
		.flatMap((t: string) => t.toLowerCase().split("\n"))
		.filter((t: string) => t.includes("respond"))
		.flatMap((t: string) => t.split(":")[1].split(","))
		.map((a: string) => a.trim().toLowerCase())
		.filter((a: string) => a !== "none");

	let prompts = msg.textSnippets
		.filter((t: string) => t.includes("<prompt>"))
		.map((t: string) =>
			t.split("<prompt>")[1].trim().split("</prompt>")[0].trim()
		);

	const thread: ChatThread = comp.getThread

	switch (cfg.id) {
		case ConfigCoordinator.id:
			if (nextActors.length === 0) {
				console.warn("=> No follow-ups");
				msg.textSnippets.push("[INFO] It appears that all assistants chose to ignore your message, lol.");
				msg.textSnippets.push("You could try sending a message that is a little more interesting!");
				return;
			}
			console.log("=> coordinator->next:", nextActors);
			for (const nextKey of nextActors) {
				if (thread.prefs.orderedResponses) {
					await handleAssistantId(nextKey, comp);
				} else {
					handleAssistantId(nextKey, comp);
				}
			}
			break;
		default:
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
				// TODO: better way to handle this dynamically instead of hard-coding
				const nextId = `${msg.userId}_gen`;
				for (let i = 0; i < prompts.length; i++) {
					const prompt = `<result>${prompts[i]}</result>`
					msg.textSnippets.push(prompt);

					const nextMsg: ChatMessage | undefined = createMessageFromUserId(
						nextId,
						comp,
					);
					if (!nextMsg) continue;
					nextMsg.textSnippets.push(prompt);
					await handleAssistantMsg(nextMsg, comp);
				}
			}
			break;
	}
};
// export const handleCoordinator = async (
// 	comp: any,
// 	orderedResponses?: boolean
// ) => {
// 	orderedResponses = orderedResponses === undefined ? true : orderedResponses;
// 	const cfg: Assistant = AssistantConfigs.coordinator;
// 	const msg: ChatMessage = buildMessage(cfg, comp);
//
// 	const res: GenerationResult = await comp.generate(cfg);
// 	console.log(res);
// 	msg.result = res.result;
// 	msg.cached = res.cached;
//
// 	if (res.errorMsg) {
// 		msg.textSnippets.push("[ERROR]\n" + res.errorMsg);
// 		comp.pushMessage(msg);
// 		return;
// 	}
// 	if (!res.textSnippets) {
// 		msg.textSnippets.push("Error: No text in result]");
// 		comp.pushMessage(msg);
// 		return;
// 	}
//
// 	msg.textSnippets = res.textSnippets
// 		? [...res.textSnippets]
// 		: ["An error occurred"];
// 	comp.pushMessage(msg);
//
// };
