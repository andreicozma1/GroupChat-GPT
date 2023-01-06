import {ChatMessage, ChatThread} from "src/util/chat/ChatModels";
import {AssistantConfigs} from "src/util/assistant/AssistantConfigs";
import {GenerationResult} from "stores/compStore";
import {createMessageFromUserCfg, createMessageFromUserId, getMessageHistory} from "src/util/chat/ChatUtils";
import {ConfigCoordinator} from "src/util/assistant/configs/ConfigCoordinator";
import {Assistant} from "src/util/assistant/AssistantModels";

export const handleAssistantCfg = (cfg: Assistant, comp: any) => {
	const msg = createMessageFromUserCfg(cfg, comp);
	return handleAssistantMsg(msg, comp);
}

export const handleAssistantMsg = async (msg: ChatMessage, comp: any, cfgUserId?: string) => {
	cfgUserId = cfgUserId || msg.userId;
	const cfg = AssistantConfigs[cfgUserId];
	console.warn("*".repeat(40));

	console.warn(`=> handleAssistantMsg (${cfg.id})`);
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
	msg.followupMsgIds.forEach((id: string) => {
		comp.deleteMessage(id, true);
	})
	msg.followupMsgIds = [];
	comp.pushMessage(msg, true);

	const msgHistIds = msg.result?.contextIds
	let ignoreCache = cfg.shouldIgnoreCache === undefined ? false : cfg.shouldIgnoreCache;
	let msgHist;
	if (!msgHistIds) {
		// First-time generation
		msgHist = getMessageHistory({
			thread: comp.getThread,
			includeSelf: true,
			includeActors: undefined,
			excludeActors: [AssistantConfigs.coordinator],
			maxLength: 10,
			maxDate: msg.dateCreated,
		});
	} else {
		// Re-generation from specified context
		msgHist = msgHistIds.map((id) => comp.getThread.messageMap[id]);
		// if there are any undefined messages, remove them
		msgHist = msgHist.filter((m) => m !== undefined);
		// TODO: This will end up with less messages than expected if there are any undefined messages
		ignoreCache = true;
	}

	const res: GenerationResult = await comp.generate(
		cfg,
		msgHist,
		ignoreCache
	);
	console.log("=> res:", res);
	msg.result = res.result;
	msg.cached = res.cached;

	if (res.errorMsg) {
		console.error("=> res.errorMsg:", res.errorMsg);
		msg.textSnippets.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(msg);
		return;
	}

	if (res?.textSnippets) msg.textSnippets = res.textSnippets
	if (res?.imageUrls) msg.imageUrls = res.imageUrls
	comp.pushMessage(msg);

	const followupActors = msg.textSnippets
		.flatMap((t: string) => t.toLowerCase().split("\n"))
		.filter((t: string) => t.includes("respond"))
		.flatMap((t: string) => t.split(":")[1].split(","))
		.map((a: string) => a.trim().toLowerCase())
		.filter((a: string) => a !== "none");

	let followupPrompts = msg.textSnippets
		.filter((t: string) => t.includes("<prompt>"))
		.map((t: string) =>
			t.split("<prompt>")[1].trim().split("</prompt>")[0].trim()
		);

	const thread: ChatThread = comp.getThread
	const followups = []

	switch (cfg.id) {
		case ConfigCoordinator.id:
			if (followupActors.length === 0) {
				console.warn("=> No follow-ups");
				msg.textSnippets.push("[INFO] It appears that all assistants chose to ignore your message, lol.");
				msg.textSnippets.push("You could try sending a message that is a little more interesting!");
				break;
			}
			console.log("=> coordinator->next:", followupActors);
			for (const nextKey of followupActors) {
				const nextMsg: ChatMessage = createMessageFromUserId(
					nextKey,
					comp
				);
				msg.followupMsgIds.push(nextMsg.id);
				nextMsg.dateCreated = msg.dateCreated
				followups.push({
					msg: nextMsg,
					cfgUserId: undefined,
				});
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
			// comp.pushMessage(msg);

			followupPrompts = followupPrompts.filter((t: string) => t.split(" ").length > 3);
			if (followupPrompts.length > 0) {
				console.log("promptText", followupPrompts);
				// TODO: better way to handle this dynamically instead of hard-coding
				const followupPromptHelperId = cfg.followupPromptHelperId;
				if (!followupPromptHelperId) {
					console.error("Error: ${cfg.id} generated ${followupPrompts.length} prompts, but no promptHelperId was specified.");
					break
				}
				for (let i = 0; i < followupPrompts.length; i++) {
					const prompt = `<result>${followupPrompts[i]}</result>`
					/*
					// msg.textSnippets.push(prompt);
					const nextMsg: ChatMessage = createMessageFromUserId(
						msg.userId,
						comp,
					);
					msg.followupMsgIds.push(nextMsg.id);
					nextMsg.textSnippets.push(prompt);
					nextMsg.dateCreated = msg.dateCreated
					comp.pushMessage(nextMsg);
					followups.push({
						msg: nextMsg,
						cfgUserId: followupPromptHelperId,
					});
					*/

					msg.textSnippets.push(prompt);
					const nextMsg: ChatMessage = createMessageFromUserId(
						followupPromptHelperId,
						comp,
					);
					msg.followupMsgIds.push(nextMsg.id);
					// nextMsg.textSnippets.push(prompt);
					nextMsg.dateCreated = msg.dateCreated
					// comp.pushMessage(nextMsg);
					followups.push({
						msg: nextMsg,
						cfgUserId: undefined,
					});
				}
			}
			break;
	}
	comp.pushMessage(msg);
	for (const nextMsg of followups) {
		if (thread.prefs.orderedResponses) {
			await handleAssistantMsg(nextMsg.msg, comp, nextMsg.cfgUserId);
		} else {
			handleAssistantMsg(nextMsg.msg, comp, nextMsg.cfgUserId);
		}
	}
};