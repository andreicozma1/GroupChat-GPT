import { assistants } from "src/util/assistant/Configs";
import { getAssistantRules, getAssistantsInfo, getConversation } from "src/util/assistant/Prompt";
import { actorsToKeys, AssistantConfig, getAllExcept, getAvailable } from "src/util/assistant/Util";
import { ChatMessage } from "src/util/Chat";
import { humanName } from "stores/compStore";

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
	const conv = getConversation(messages, [], [assistants.coordinator], 5);
	const end = `### ${actor.name}:\n`;
	return (start + info + rules + examples + conv + end).trim();
};

const coordinatorPromptExamples = (actor: AssistantConfig): string => {
	let res = "### EXAMPLES ###\n";
	res += `### ${humanName}:\n`;
	res += `Hello, what's up ${assistants.davinci.name}?\n`;
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${assistants.coordinator.vals.willIgnore}: ${actorsToKeys(getAllExcept(assistants.davinci)).join(", ")}\n`;
	res += `${assistants.coordinator.vals.willRespond}: ${assistants.davinci.key}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += "How are you all doing?\n";
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${assistants.coordinator.vals.willIgnore}: None\n`;
	res += `${assistants.coordinator.vals.willRespond}: ${actorsToKeys(getAvailable()).join(", ")}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += "I need to create a painting.\n";
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${assistants.coordinator.vals.willIgnore}: ${actorsToKeys(getAllExcept(assistants.dalle)).join(", ")}\n`;
	res += `${assistants.coordinator.vals.willRespond}: ${assistants.dalle.key}\n`;
	res += "\n";

	res += `### ${humanName}:\n`;
	res += `Hey ${assistants.codex.name}, could you write some code something for me?\n`;
	res += "\n";

	res += `### ${actor.name}:\n`;
	res += `${assistants.coordinator.vals.willIgnore}: ${actorsToKeys(getAllExcept(assistants.codex)).join(", ")}\n`;
	res += `${assistants.coordinator.vals.willRespond}: ${assistants.codex.key}\n`;
	res += "\n";
	return res;
};
