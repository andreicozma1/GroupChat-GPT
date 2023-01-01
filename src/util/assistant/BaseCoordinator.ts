import { actors } from "src/util/assistant/Configs"
import { actorsToKeys, getAllExcept, getAvailable } from "src/util/assistant/Util"
import { ActorConfig, TextMessage } from "src/util/Models";
import { humanName } from "stores/compStore";
import { getPromptAssistantRules, getPromptAssistantsInfo, getPromptChatHistory } from "src/util/Prompt";

function coordinatorPromptStart(actor: ActorConfig): string {
	let res = "### COORDINATOR ###\n";
	res += "Choose which assistant(s) would be the absolute best at responding to the user's message.\n";
	res += "Only respond with the exact names of the assistant(s).\n";
	res += "If multiple assistants are requested or fit to respond, separate each of their names by commas.\n";
	res += "Take into consideration their personalities, strengths, weaknesses, and abilities.\n";
	res += "Also keep the logical consistency of the conversation in mind.\n";
	res += "\n";

	res += getPromptAssistantRules();
	res += getPromptAssistantsInfo(true);

	res += "### EXAMPLES ###\n";
	res += `### ${humanName}:\n`;
	res += `Hello, what's up ${actors.davinci.name}?\n`;
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: ${actorsToKeys(getAllExcept(actors.davinci)).join(", ")}\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actors.davinci.key}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += "How are you all doing?\n";
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: None\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actorsToKeys(getAvailable()).join(", ")}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += "I need to create a painting.\n";
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: ${actorsToKeys(getAllExcept(actors.dalle)).join(", ")}\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actors.dalle.key}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += `Hey ${actors.codex.name}, could you write some code something for me?\n`;
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${actors.coordinator.vals.willIgnore}: ${actorsToKeys(getAllExcept(actors.codex)).join(", ")}\n`;
	res += `${actors.coordinator.vals.willRespond}: ${actors.codex.key}\n`;
	res += "\n";

	return res;
}

export const createPromptCoordinator = (actor: ActorConfig, messages: TextMessage[]) => {
	const res = coordinatorPromptStart(actor);
	const conv = getPromptChatHistory(messages, [], [actors.coordinator], 5);
	const end = `### ${actor.name}:\n`;
	const prompt = res + conv + end;
	return prompt.trim();
};
