import { actors } from "src/util/assistant/Configs";
import { actorsToKeys, AssistantConfig, getAllExcept, getAvailable } from "src/util/assistant/Util";
import { ChatMessage } from "src/util/Chat";
import { humanName } from "stores/compStore";
import { getAssistantRules, getAssistantsInfo, getConversation } from "src/util/assistant/Prompt";

const coordinatorPromptStart =
	"### COORDINATOR ###\n" +
	"Choose which assistant(s) would be the absolute best at responding to the user's message.\n" +
	"Only respond with the exact names of the assistant(s).\n" +
	"If multiple assistants are requested or fit to respond, separate each of their names by commas.\n" +
	"Take into consideration their personalities, strengths, weaknesses, and abilities.\n" +
	"Also keep the logical consistency of the conversation in mind.\n" +
	"\n";

export const createPromptCoordinator = (actor: AssistantConfig, messages: ChatMessage[]) => {
	const start = coordinatorPromptStart;
	const rules = getAssistantRules();
	const info = getAssistantsInfo(true);
	const examples = coordinatorPromptExamples(actor);
	const conv = getConversation(messages, [], [actors.coordinator], 5);
	const end = `### ${actor.name}:\n`;
	return (start + rules + info + examples + conv + end).trim();
};

const coordinatorPromptExamples = (actor: AssistantConfig): string => {
	let res = "### EXAMPLES ###\n";
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
};
