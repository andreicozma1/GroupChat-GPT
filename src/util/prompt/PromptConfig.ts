import {Assistant} from "src/util/assistant/AssistantModels";
import {ConfigUserBase} from "src/util/chat/ConfigUserBase";
import {PromptConfig} from "src/util/prompt/PromptModels";

export const parsePromptConfig = (ai: Assistant): PromptConfig => {
	const conf: PromptConfig = ai.promptConfig;
	return {
		...conf,
		promptType: "createAssistantPrompt",
		exampleQueryId: conf?.exampleQueryId ?? ConfigUserBase.name,
		exampleResponseId: conf?.exampleResponseId ?? ai.name,
		exampleUseHeader: conf?.exampleUseHeader ?? true,
	}
}