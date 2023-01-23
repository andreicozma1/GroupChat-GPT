import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {User, UserTypes} from "src/util/chat/User";

export const assistantFilter = (user?: User) =>
	!user || user.type === UserTypes.ASSISTANT || user.type === UserTypes.HELPER;

export class UserChattingAssistant extends User {
	constructor(id: string, name: string) {
		super(id, name, UserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.CONVERSATION;
		this.addTraits({
						   personality: ["friendly", "polite"],
						   strengths: ["making conversation", "answering general questions"],
						   weaknesses: [],
						   abilities: []
					   })
		this.addRules({
						  always: [
							  "Strictly follow rules, examples, and guidelines.",
							  "Respond in a way that follows the logical flow and consistency of the conversation.",
							  "If asked a question, provide an answer that is on-topic, complete, and clear.",
						  ],
						  never: [
							  "Repeat previous messages verbatim.",
							  "Talk to other assistants, unless explicitly tagged (ex: @davinci).",
							  "Make assumptions about the user's intentions.",
						  ],
						  sometimes: [
							  "May tag a more appropriate assistant into the conversation if their profile is more relevant to a specific request (ex: @dalle if talking about art).",
						  ]
					  })
	}
}
